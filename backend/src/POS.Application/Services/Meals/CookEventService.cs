using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Meals;
using POS.Core.Entities.Meals;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Meals;

public class CookEventService
{
    private readonly MongoDbContext _context;
    private readonly InventoryService _inventory;
    private readonly ILogger<CookEventService> _logger;

    public CookEventService(MongoDbContext context, InventoryService inventory, ILogger<CookEventService> logger)
    {
        _context = context;
        _inventory = inventory;
        _logger = logger;
    }

    public async Task<CookEventDto> CompleteCookAsync(string userId, CompleteCookRequest request)
    {
        if (!string.IsNullOrEmpty(request.IdempotencyKey))
        {
            var existingFilter = Builders<CookEvent>.Filter.And(
                Builders<CookEvent>.Filter.Eq(e => e.UserId, userId),
                Builders<CookEvent>.Filter.Eq(e => e.IdempotencyKey, request.IdempotencyKey));
            var existing = await _context.CookEvents.Find(existingFilter).FirstOrDefaultAsync();
            if (existing != null)
                return MapToDto(existing);
        }

        if (!TryParseOutcome(request.Outcome, out var outcome))
            throw new ValidationException("outcome", "Outcome must be Cooked, PartlyCooked, DidNotCook, or Skipped.");

        var makeAgain = request.FeedbackMakeAgain != null && Enum.TryParse<MakeAgainChoice>(request.FeedbackMakeAgain, true, out var ma)
            ? ma
            : (MakeAgainChoice?)null;

        var planFilter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.ElemMatch(p => p.Slots, s => s.Id == request.MealSlotId));

        var plan = await _context.MealPlans.Find(planFilter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Meal slot not found in any plan.");

        var slot = plan.Slots.First(s => s.Id == request.MealSlotId);
        if (slot.State != MealSlotState.Planned)
            throw new BusinessException("Meal already completed.");

        var recipeVersionId = request.RecipeVersionId ?? slot.RecipeVersionId;
        var cookEvent = new CookEvent
        {
            UserId = userId,
            MealSlotId = request.MealSlotId,
            RecipeVersionId = recipeVersionId,
            Outcome = outcome,
            ActualServings = request.ActualServings,
            CookedAt = DateTime.UtcNow,
            ActualHandsonMinutes = request.ActualHandsonMinutes,
            FeedbackMakeAgain = makeAgain,
            FeedbackReason = request.FeedbackReason,
            IdempotencyKey = request.IdempotencyKey,
            IngredientAdjustments = request.IngredientAdjustments.Select(a => new IngredientAdjustment
            {
                IngredientId = a.IngredientId,
                RawName = a.RawName,
                AmountUsed = a.AmountUsed,
                Unit = a.Unit,
                BatchId = a.BatchId,
            }).ToList(),
        };

        if (outcome is CookOutcome.Cooked or CookOutcome.PartlyCooked)
            await ConsumeIngredientsAsync(userId, slot, recipeVersionId, request);

        if (outcome == CookOutcome.Cooked && request.StoredPortions.Any())
        {
            foreach (var portion in request.StoredPortions)
            {
                var leftover = await _inventory.AddLeftoverAsync(
                    userId,
                    portion.Description,
                    portion.Portions,
                    portion.Location,
                    $"Leftover from meal slot {request.MealSlotId}");

                cookEvent.StoredPortions.Add(new StoredPortion
                {
                    Description = portion.Description,
                    Portions = portion.Portions,
                    Location = Enum.TryParse<StorageLocation>(portion.Location, out var l) ? l : StorageLocation.Fridge,
                    StoredAt = portion.StoredAt ?? DateTime.UtcNow,
                    InventoryBatchId = leftover.Id,
                });
            }
        }

        await _context.CookEvents.InsertOneAsync(cookEvent);

        slot.State = outcome switch
        {
            CookOutcome.Cooked => MealSlotState.Cooked,
            CookOutcome.PartlyCooked => MealSlotState.PartlyCooked,
            _ => MealSlotState.Skipped,
        };
        slot.CookEventId = cookEvent.Id;

        var planUpdateFilter = Builders<MealPlan>.Filter.Eq(p => p.Id, plan.Id);
        await _context.MealPlans.ReplaceOneAsync(planUpdateFilter, plan);

        _logger.LogInformation("Completed cook event {EventId} for slot {SlotId} as {Outcome}", cookEvent.Id, request.MealSlotId, outcome);
        return MapToDto(cookEvent);
    }

    private async Task ConsumeIngredientsAsync(
        string userId,
        MealSlot slot,
        string? recipeVersionId,
        CompleteCookRequest request)
    {
        var usage = new Dictionary<string, (decimal amount, string unit, string? batchId)>(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(recipeVersionId))
        {
            var recipe = await _context.RecipeVersions
                .Find(r => r.Id == recipeVersionId)
                .FirstOrDefaultAsync();
            if (recipe != null)
            {
                var scale = recipe.YieldServings > 0
                    ? (decimal)(request.ActualServings ?? slot.Servings) / recipe.YieldServings
                    : 1m;
                foreach (var ingredient in recipe.Ingredients.Where(i => !i.IsOptional && !string.IsNullOrWhiteSpace(i.RawName)))
                {
                    usage[ingredient.RawName] = (
                        (ingredient.Amount ?? 1m) * scale,
                        ingredient.Unit ?? "unit",
                        null);
                }
            }
        }

        foreach (var adjustment in request.IngredientAdjustments)
        {
            if (string.IsNullOrWhiteSpace(adjustment.RawName) || !adjustment.AmountUsed.HasValue)
                continue;
            usage[adjustment.RawName] = (adjustment.AmountUsed.Value, adjustment.Unit ?? "unit", adjustment.BatchId);
        }

        foreach (var (name, used) in usage)
            await _inventory.ConsumeAsync(userId, name, used.amount, used.unit, used.batchId, $"Cooked {slot.RecipeName}");
    }

    private static bool TryParseOutcome(string? raw, out CookOutcome outcome)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            outcome = CookOutcome.Cooked;
            return true;
        }

        if (raw.Equals("Skipped", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("Skip", StringComparison.OrdinalIgnoreCase)
            || raw.Equals("DidNotCook", StringComparison.OrdinalIgnoreCase))
        {
            outcome = CookOutcome.DidNotCook;
            return true;
        }

        if (Enum.TryParse(raw, true, out outcome) && Enum.IsDefined(outcome))
            return true;

        outcome = CookOutcome.Cooked;
        return false;
    }

    private static CookEventDto MapToDto(CookEvent e) => new()
    {
        Id = e.Id,
        MealSlotId = e.MealSlotId,
        RecipeVersionId = e.RecipeVersionId,
        Outcome = e.Outcome.ToString(),
        ActualServings = e.ActualServings,
        CookedAt = e.CookedAt,
        ActualHandsonMinutes = e.ActualHandsonMinutes,
        FeedbackMakeAgain = e.FeedbackMakeAgain?.ToString(),
        FeedbackReason = e.FeedbackReason,
        StoredPortions = e.StoredPortions.Select(p => new StoredPortionDto
        {
            Description = p.Description,
            Portions = p.Portions,
            Location = p.Location.ToString(),
            StoredAt = p.StoredAt,
        }).ToList(),
    };
}
