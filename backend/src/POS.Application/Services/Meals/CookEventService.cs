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
    private readonly ILogger<CookEventService> _logger;

    public CookEventService(MongoDbContext context, ILogger<CookEventService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CookEventDto> CompleteCookAsync(string userId, CompleteCookRequest request)
    {
        // Idempotency: check for existing event with same key
        if (!string.IsNullOrEmpty(request.IdempotencyKey))
        {
            var existingFilter = Builders<CookEvent>.Filter.And(
                Builders<CookEvent>.Filter.Eq(e => e.UserId, userId),
                Builders<CookEvent>.Filter.Eq(e => e.IdempotencyKey, request.IdempotencyKey));
            var existing = await _context.CookEvents.Find(existingFilter).FirstOrDefaultAsync();
            if (existing != null)
                return MapToDto(existing);
        }

        // Validate meal slot exists
        var planFilter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.ElemMatch(p => p.Slots, s => s.Id == request.MealSlotId));

        var plan = await _context.MealPlans.Find(planFilter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Meal slot not found in any plan.");

        var slot = plan.Slots.First(s => s.Id == request.MealSlotId);

        var outcome = Enum.TryParse<CookOutcome>(request.Outcome, out var co) ? co : CookOutcome.Cooked;
        var makeAgain = request.FeedbackMakeAgain != null && Enum.TryParse<MakeAgainChoice>(request.FeedbackMakeAgain, out var ma) ? ma : (MakeAgainChoice?)null;

        var cookEvent = new CookEvent
        {
            UserId = userId,
            MealSlotId = request.MealSlotId,
            RecipeVersionId = request.RecipeVersionId ?? slot.RecipeVersionId,
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

        // Create stored portion batches for leftovers
        if (outcome == CookOutcome.Cooked && request.StoredPortions.Any())
        {
            foreach (var portion in request.StoredPortions)
            {
                var portionBatch = new InventoryBatch
                {
                    UserId = userId,
                    RawName = portion.Description,
                    Form = "cooked",
                    CurrentAmount = portion.Portions,
                    Unit = "portions",
                    Location = Enum.TryParse<StorageLocation>(portion.Location, out var loc) ? loc : StorageLocation.Fridge,
                    PurchasedAt = portion.StoredAt ?? DateTime.UtcNow,
                    Confidence = DataConfidence.UserConfirmed,
                    DateType = DateType.Unknown,
                    Notes = $"Leftover from meal slot {request.MealSlotId}",
                };

                await _context.InventoryBatches.InsertOneAsync(portionBatch);

                var movement = new InventoryMovement
                {
                    UserId = userId,
                    BatchId = portionBatch.Id,
                    Kind = MovementKind.Purchased,
                    AmountDelta = portion.Portions,
                    Unit = "portions",
                    Note = "Stored leftover",
                    OccurredAt = DateTime.UtcNow,
                };
                await _context.InventoryMovements.InsertOneAsync(movement);

                cookEvent.StoredPortions.Add(new StoredPortion
                {
                    Description = portion.Description,
                    Portions = portion.Portions,
                    Location = Enum.TryParse<StorageLocation>(portion.Location, out var l) ? l : StorageLocation.Fridge,
                    StoredAt = portion.StoredAt ?? DateTime.UtcNow,
                    InventoryBatchId = portionBatch.Id,
                });
            }
        }

        await _context.CookEvents.InsertOneAsync(cookEvent);

        // Update meal slot state
        slot.State = outcome switch
        {
            CookOutcome.Cooked => MealSlotState.Cooked,
            CookOutcome.PartlyCooked => MealSlotState.PartlyCooked,
            _ => MealSlotState.Skipped,
        };
        slot.CookEventId = cookEvent.Id;

        var planUpdateFilter = Builders<MealPlan>.Filter.Eq(p => p.Id, plan.Id);
        await _context.MealPlans.ReplaceOneAsync(planUpdateFilter, plan);

        _logger.LogInformation("Completed cook event {EventId} for slot {SlotId}", cookEvent.Id, request.MealSlotId);
        return MapToDto(cookEvent);
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
