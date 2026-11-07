using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using POS.Application.DTOs.Meals;
using POS.Application.Services.Day;
using POS.Core.Entities.Meals;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Meals;

public class MealPlanService
{
    private readonly MongoDbContext _context;
    private readonly UserDayClock _dayClock;
    private readonly ILogger<MealPlanService> _logger;

    public MealPlanService(MongoDbContext context, UserDayClock dayClock, ILogger<MealPlanService> logger)
    {
        _context = context;
        _dayClock = dayClock;
        _logger = logger;
    }

    public async Task<MealPlanDto?> GetActivePlanAsync(string userId)
    {
        var today = await _dayClock.GetTodayAsync(userId);
        var plan = await FindCurrentPlanAsync(userId, today);
        return plan == null ? null : await MapToDtoAsync(plan, userId);
    }

    public async Task<MealPlanDto> CreatePlanAsync(string userId, CreateMealPlanRequest request)
    {
        var archiveFilter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.Ne(p => p.Status, MealPlanStatus.Archived));

        await _context.MealPlans.UpdateManyAsync(archiveFilter,
            Builders<MealPlan>.Update.Set(p => p.Status, MealPlanStatus.Archived));

        var plan = new MealPlan
        {
            UserId = userId,
            WeekStartDate = request.WeekStartDate,
            WeekEndDate = request.WeekEndDate,
            Status = MealPlanStatus.Active,
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
        _logger.LogInformation("Created active MealPlan {PlanId} for user {UserId}", plan.Id, userId);
        return await MapToDtoAsync(plan, userId);
    }

    public async Task<MealPlanDto> ActivatePlanAsync(string userId, string planId)
    {
        var filter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.Id, planId),
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId));

        var plan = await _context.MealPlans.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Meal plan not found.");

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
        if (request.HandsonMinutes.HasValue) slot.HandsonMinutes = request.HandsonMinutes;
        if (request.TotalMinutes.HasValue) slot.TotalMinutes = request.TotalMinutes;

        plan.Version++;
        plan.UpdatedAt = DateTime.UtcNow;
        await _context.MealPlans.ReplaceOneAsync(filter, plan);

        return await MapToDtoAsync(plan, userId);
    }

    public async Task<TodayMealCardDto> GetTodayCardAsync(string userId)
    {
        var today = await _dayClock.GetTodayAsync(userId);
        var plan = await FindCurrentPlanAsync(userId, today);
        if (plan == null)
            return new TodayMealCardDto();

        var todaySlots = plan.Slots
            .Where(s => IsSameLocalDate(s.LocalDate, today))
            .OrderBy(s => s.State == MealSlotState.Planned ? 0 : 1)
            .ThenBy(s => s.Slot)
            .ToList();

        var actionable = todaySlots.Where(s => s.State == MealSlotState.Planned).ToList();
        var nextSlot = actionable.FirstOrDefault(s => s.Slot == MealSlotKind.Dinner)
            ?? actionable.FirstOrDefault()
            ?? todaySlots.FirstOrDefault();

        if (nextSlot == null)
            return new TodayMealCardDto { ActionableReminder = "Δεν υπάρχει προγραμματισμένο γεύμα για σήμερα." };

        var dto = MapSlotToDto(nextSlot);
        if (string.IsNullOrWhiteSpace(dto.RecipeName) && ObjectId.TryParse(dto.RecipeVersionId, out _))
        {
            var recipe = await _context.RecipeVersions
                .Find(r => r.Id == dto.RecipeVersionId)
                .FirstOrDefaultAsync();
            if (recipe != null)
            {
                dto.RecipeName = recipe.NameEl;
                dto.HandsonMinutes ??= recipe.HandsonMinutes;
                dto.TotalMinutes ??= recipe.TotalMinutes;
            }
        }

        return new TodayMealCardDto
        {
            NextMeal = dto,
            ActionableReminder = nextSlot.HandsonMinutes.HasValue
                ? $"Ξεκινήστε στις {DateTime.UtcNow.AddHours(2).AddMinutes(-(nextSlot.TotalMinutes ?? 0)):HH:mm}"
                : null,
            HasUnconfirmedIngredients = false,
        };
    }

    private async Task<MealPlan?> FindCurrentPlanAsync(string userId, DateTime today)
    {
        var filter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.In(p => p.Status, new[] { MealPlanStatus.Active, MealPlanStatus.Draft }),
            Builders<MealPlan>.Filter.Lte(p => p.WeekStartDate, today.AddDays(1)),
            Builders<MealPlan>.Filter.Gte(p => p.WeekEndDate, today.AddDays(-1)));

        return await _context.MealPlans.Find(filter)
            .SortByDescending(p => p.Status)
            .ThenByDescending(p => p.WeekStartDate)
            .FirstOrDefaultAsync();
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

        var missingNameSlots = dto.Slots
            .Where(s => string.IsNullOrWhiteSpace(s.RecipeName) && s.RecipeVersionId != null)
            .ToList();
        if (missingNameSlots.Count > 0)
        {
            var ids = missingNameSlots
                .Select(s => s.RecipeVersionId!)
                .Where(id => ObjectId.TryParse(id, out _))
                .Distinct()
                .ToList();
            if (ids.Count > 0)
            {
                var recipeFilter = Builders<RecipeVersion>.Filter.In(r => r.Id, ids);
                var recipes = await _context.RecipeVersions.Find(recipeFilter).ToListAsync();
                var recipeMap = recipes.ToDictionary(r => r.Id);

                foreach (var slot in dto.Slots)
                {
                    if (slot.RecipeVersionId != null && recipeMap.TryGetValue(slot.RecipeVersionId, out var rv))
                    {
                        if (string.IsNullOrWhiteSpace(slot.RecipeName))
                            slot.RecipeName = rv.NameEl;
                        slot.HandsonMinutes ??= rv.HandsonMinutes;
                        slot.TotalMinutes ??= rv.TotalMinutes;
                    }
                }
            }
        }

        return dto;
    }

    private static bool IsSameLocalDate(string localDate, DateTime today)
    {
        if (string.IsNullOrWhiteSpace(localDate))
            return false;

        var expected = today.ToString("yyyy-MM-dd");
        if (localDate.StartsWith(expected, StringComparison.Ordinal))
            return true;

        return DateTime.TryParse(localDate, out var parsed) && parsed.Date == today.Date;
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
