using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Meals;
using POS.Core.Entities.Meals;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Meals;

public class MealPlanService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<MealPlanService> _logger;

    public MealPlanService(MongoDbContext context, ILogger<MealPlanService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<MealPlanDto?> GetActivePlanAsync(string userId)
    {
        var now = DateTime.UtcNow.Date;
        var filter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.In(p => p.Status, new[] { MealPlanStatus.Active, MealPlanStatus.Draft }),
            Builders<MealPlan>.Filter.Gte(p => p.WeekEndDate, now));

        var plan = await _context.MealPlans.Find(filter)
            .SortByDescending(p => p.WeekStartDate)
            .FirstOrDefaultAsync();

        return plan == null ? null : await MapToDtoAsync(plan, userId);
    }

    public async Task<MealPlanDto> CreatePlanAsync(string userId, CreateMealPlanRequest request)
    {
        // Expire any active draft for the same week
        var existingFilter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.Eq(p => p.Status, MealPlanStatus.Draft),
            Builders<MealPlan>.Filter.Eq(p => p.WeekStartDate, request.WeekStartDate));

        await _context.MealPlans.UpdateManyAsync(existingFilter,
            Builders<MealPlan>.Update.Set(p => p.Status, MealPlanStatus.Archived));

        var plan = new MealPlan
        {
            UserId = userId,
            WeekStartDate = request.WeekStartDate,
            WeekEndDate = request.WeekEndDate,
            Status = MealPlanStatus.Draft,
            Slots = request.Slots.Select(s => new MealSlot
            {
                LocalDate = s.LocalDate,
                Slot = Enum.TryParse<MealSlotKind>(s.Slot, out var slot) ? slot : MealSlotKind.Dinner,
                Kind = Enum.TryParse<MealKind>(s.Kind, out var kind) ? kind : MealKind.FreshCook,
                RecipeVersionId = s.RecipeVersionId,
                RecipeName = s.RecipeName,
                Servings = s.Servings,
                Locked = s.Locked,
                ReasonSummary = s.ReasonSummary,
                HandsonMinutes = s.HandsonMinutes,
                TotalMinutes = s.TotalMinutes,
            }).ToList(),
        };

        await _context.MealPlans.InsertOneAsync(plan);
        _logger.LogInformation("Created MealPlan {PlanId} for user {UserId}", plan.Id, userId);
        return await MapToDtoAsync(plan, userId);
    }

    public async Task<MealPlanDto> ActivatePlanAsync(string userId, string planId)
    {
        var filter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.Id, planId),
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId));

        var plan = await _context.MealPlans.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Meal plan not found.");

        // Archive other active plans for same week
        var archiveFilter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.Eq(p => p.Status, MealPlanStatus.Active),
            Builders<MealPlan>.Filter.Ne(p => p.Id, planId));
        await _context.MealPlans.UpdateManyAsync(archiveFilter,
            Builders<MealPlan>.Update.Set(p => p.Status, MealPlanStatus.Archived));

        plan.Status = MealPlanStatus.Active;
        plan.Version++;
        plan.UpdatedAt = DateTime.UtcNow;
        await _context.MealPlans.ReplaceOneAsync(filter, plan);

        return await MapToDtoAsync(plan, userId);
    }

    public async Task<MealPlanDto> UpdateSlotAsync(string userId, string planId, UpdateMealSlotRequest request)
    {
        var filter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.Id, planId),
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId));

        var plan = await _context.MealPlans.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Meal plan not found.");

        var slot = plan.Slots.FirstOrDefault(s => s.Id == request.SlotId)
            ?? throw new NotFoundException("Meal slot not found.");

        if (slot.Locked && request.Locked != false)
            throw new BusinessException("Slot is locked. Unlock it first.");

        if (request.Kind != null && Enum.TryParse<MealKind>(request.Kind, out var kind)) slot.Kind = kind;
        if (request.RecipeVersionId != null) slot.RecipeVersionId = request.RecipeVersionId;
        if (request.RecipeName != null) slot.RecipeName = request.RecipeName;
        if (request.Servings.HasValue) slot.Servings = request.Servings.Value;
        if (request.Locked.HasValue) slot.Locked = request.Locked.Value;
        if (request.State != null && Enum.TryParse<MealSlotState>(request.State, out var state)) slot.State = state;

        plan.Version++;
        plan.UpdatedAt = DateTime.UtcNow;
        await _context.MealPlans.ReplaceOneAsync(filter, plan);

        return await MapToDtoAsync(plan, userId);
    }

    public async Task<TodayMealCardDto> GetTodayCardAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        var filter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.Eq(p => p.Status, MealPlanStatus.Active),
            Builders<MealPlan>.Filter.Lte(p => p.WeekStartDate, today),
            Builders<MealPlan>.Filter.Gte(p => p.WeekEndDate, today));

        var plan = await _context.MealPlans.Find(filter).FirstOrDefaultAsync();
        if (plan == null)
            return new TodayMealCardDto();

        var todaySlots = plan.Slots
            .Where(s => s.LocalDate == today.ToString("yyyy-MM-dd") && s.State == MealSlotState.Planned)
            .OrderBy(s => s.Slot)
            .ToList();

        var nextSlot = todaySlots.FirstOrDefault(s => s.Slot == MealSlotKind.Dinner)
            ?? todaySlots.FirstOrDefault();

        if (nextSlot == null)
            return new TodayMealCardDto { ActionableReminder = "Δεν υπάρχει προγραμματισμένο γεύμα για σήμερα." };

        return new TodayMealCardDto
        {
            NextMeal = MapSlotToDto(nextSlot),
            ActionableReminder = nextSlot.HandsonMinutes.HasValue
                ? $"Ξεκινήστε στις {DateTime.UtcNow.AddHours(2).AddMinutes(-nextSlot.TotalMinutes ?? 0):HH:mm}"
                : null,
            HasUnconfirmedIngredients = false,
        };
    }

    private async Task<MealPlanDto> MapToDtoAsync(MealPlan plan, string userId)
    {
        var dto = new MealPlanDto
        {
            Id = plan.Id,
            WeekStartDate = plan.WeekStartDate,
            WeekEndDate = plan.WeekEndDate,
            Status = plan.Status.ToString(),
            Version = plan.Version,
            Slots = plan.Slots.Select(MapSlotToDto).ToList(),
        };

        // Enrich slots with recipe names from the database when missing
        var missingNameSlots = dto.Slots.Where(s => s.RecipeName == null && s.RecipeVersionId != null).ToList();
        if (missingNameSlots.Any())
        {
            var ids = missingNameSlots.Select(s => s.RecipeVersionId!).Distinct().ToList();
            var recipeFilter = Builders<RecipeVersion>.Filter.In(r => r.Id, ids);
            var recipes = await _context.RecipeVersions.Find(recipeFilter).ToListAsync();
            var recipeMap = recipes.ToDictionary(r => r.Id);

            foreach (var slot in dto.Slots)
            {
                if (slot.RecipeVersionId != null && recipeMap.TryGetValue(slot.RecipeVersionId, out var rv))
                {
                    slot.RecipeName = rv.NameEl;
                    slot.HandsonMinutes = rv.HandsonMinutes;
                    slot.TotalMinutes = rv.TotalMinutes;
                }
            }
        }

        return dto;
    }

    private static MealSlotDto MapSlotToDto(MealSlot slot) => new()
    {
        Id = slot.Id,
        LocalDate = slot.LocalDate,
        Slot = slot.Slot.ToString(),
        Kind = slot.Kind.ToString(),
        RecipeVersionId = slot.RecipeVersionId,
        RecipeName = slot.RecipeName,
        Servings = slot.Servings,
        Locked = slot.Locked,
        SourceMealSlotId = slot.SourceMealSlotId,
        ReasonSummary = slot.ReasonSummary,
        HandsonMinutes = slot.HandsonMinutes,
        TotalMinutes = slot.TotalMinutes,
        State = slot.State.ToString(),
        CookEventId = slot.CookEventId,
    };
}
