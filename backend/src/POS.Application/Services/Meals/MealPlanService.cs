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
    private readonly RecipeService _recipes;
    private readonly InventoryService _inventory;
    private readonly MealProfileService _profile;
    private readonly ILogger<MealPlanService> _logger;

    public MealPlanService(
        MongoDbContext context,
        UserDayClock dayClock,
        RecipeService recipes,
        InventoryService inventory,
        MealProfileService profile,
        ILogger<MealPlanService> logger)
    {
        _context = context;
        _dayClock = dayClock;
        _recipes = recipes;
        _inventory = inventory;
        _profile = profile;
        _logger = logger;
    }

    public async Task<MealPlanDto?> GetActivePlanAsync(string userId)
    {
        return await EnsureCurrentWeekAsync(userId);
    }

    public async Task<MealPlanDto> EnsureCurrentWeekAsync(string userId)
    {
        var today = await _dayClock.GetTodayAsync(userId);
        var monday = UserDayClock.StartOfWeekMonday(today);
        var sunday = monday.AddDays(6);
        var weekStart = DateTime.SpecifyKind(monday, DateTimeKind.Utc);
        var weekEnd = DateTime.SpecifyKind(sunday, DateTimeKind.Utc);

        var plan = await FindWeekPlanAsync(userId, monday, sunday);
        var becameActive = false;
        if (plan == null)
        {
            var archiveFilter = Builders<MealPlan>.Filter.And(
                Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
                Builders<MealPlan>.Filter.Ne(p => p.Status, MealPlanStatus.Archived));
            await _context.MealPlans.UpdateManyAsync(archiveFilter,
                Builders<MealPlan>.Update.Set(p => p.Status, MealPlanStatus.Archived));

            plan = new MealPlan
            {
                UserId = userId,
                WeekStartDate = weekStart,
                WeekEndDate = weekEnd,
                Status = MealPlanStatus.Active,
                Slots = new List<MealSlot>(),
            };
            await _context.MealPlans.InsertOneAsync(plan);
            becameActive = true;
            _logger.LogInformation("Created current-week MealPlan {PlanId} for user {UserId}", plan.Id, userId);
        }
        else if (plan.Status != MealPlanStatus.Active)
        {
            plan.Status = MealPlanStatus.Active;
            becameActive = true;
        }

        var profile = await _profile.GetOrCreateProfileAsync(userId);
        var servings = profile.DefaultServings > 0 ? profile.DefaultServings : 2;
        var changed = await FillMissingSlotsAsync(userId, plan, monday, servings);
        if (changed || becameActive)
        {
            plan.UpdatedAt = DateTime.UtcNow;
            plan.Version++;
            await _context.MealPlans.ReplaceOneAsync(p => p.Id == plan.Id, plan);
        }

        return await MapToDtoAsync(plan, userId);
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
        var planDto = await EnsureCurrentWeekAsync(userId);
        var plan = await FindWeekPlanAsync(userId, UserDayClock.StartOfWeekMonday(today), UserDayClock.StartOfWeekMonday(today).AddDays(6));
        if (plan == null)
            return new TodayMealCardDto { ActionableReminder = "No meal planned for today." };

        var todaySlots = plan.Slots
            .Where(s => IsSameLocalDate(s.LocalDate, today))
            .OrderBy(s => s.Slot)
            .ToList();

        var nextSlot = todaySlots.FirstOrDefault(s => s.State == MealSlotState.Planned);
        if (nextSlot == null)
        {
            return new TodayMealCardDto
            {
                PlanId = plan.Id,
                NextMeal = null,
                ActionableReminder = todaySlots.Count == 0
                    ? "No meal planned for today."
                    : "All of today’s meals are done.",
                HasUnconfirmedIngredients = false,
            };
        }

        var dto = planDto.Slots.FirstOrDefault(s => s.Id == nextSlot.Id) ?? MapSlotToDto(nextSlot);
        var tz = await _dayClock.GetTimeZoneInfoAsync(userId);
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var reminder = BuildStartReminder(nextSlot, today, nowLocal);

        return new TodayMealCardDto
        {
            PlanId = plan.Id,
            NextMeal = dto,
            ActionableReminder = reminder,
            HasUnconfirmedIngredients = dto.MissingIngredients.Count > 0 || dto.UncertainIngredients.Count > 0,
        };
    }

    private async Task<MealPlan?> FindWeekPlanAsync(string userId, DateTime monday, DateTime sunday)
    {
        var filter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<MealPlan>.Filter.Ne(p => p.Status, MealPlanStatus.Archived));

        var plans = await _context.MealPlans.Find(filter)
            .SortByDescending(p => p.Status)
            .ThenByDescending(p => p.WeekStartDate)
            .ToListAsync();

        return plans.FirstOrDefault(p =>
            p.WeekStartDate.Date <= sunday.Date && p.WeekEndDate.Date >= monday.Date);
    }

    private async Task<bool> FillMissingSlotsAsync(string userId, MealPlan plan, DateTime monday, int servings)
    {
        var changed = false;
        MealSlot? previousDinner = null;
        var recipeCache = new Dictionary<string, RecipeVersionDto>(StringComparer.OrdinalIgnoreCase);

        for (var dayOffset = 0; dayOffset < 7; dayOffset++)
        {
            var date = monday.AddDays(dayOffset);
            var localDate = date.ToString("yyyy-MM-dd");
            var menu = MenuFor(date.DayOfWeek);

            foreach (var dish in menu)
            {
                var slot = plan.Slots.FirstOrDefault(s =>
                    IsSameLocalDate(s.LocalDate, date) && s.Slot == dish.Slot);

                if (slot != null && slot.State != MealSlotState.Planned)
                {
                    if (dish.Slot == MealSlotKind.Dinner)
                        previousDinner = slot;
                    continue;
                }

                if (slot == null)
                {
                    slot = new MealSlot
                    {
                        LocalDate = localDate,
                        Slot = dish.Slot,
                        Kind = dish.Kind,
                        Servings = servings,
                        ReasonSummary = dish.Reason,
                        State = MealSlotState.Planned,
                    };
                    plan.Slots.Add(slot);
                    changed = true;
                }

                var dishName = dish.Name;
                var kind = dish.Kind;
                if (kind == MealKind.Leftovers && previousDinner != null)
                {
                    dishName = string.IsNullOrWhiteSpace(previousDinner.RecipeName)
                        ? dish.Name
                        : $"Leftovers: {previousDinner.RecipeName}";
                    slot.SourceMealSlotId = previousDinner.Id;
                    slot.Kind = MealKind.Leftovers;
                }

                var needsRecipe = string.IsNullOrWhiteSpace(slot.RecipeVersionId)
                    || string.IsNullOrWhiteSpace(slot.RecipeName);
                if (needsRecipe)
                {
                    var cacheKey = $"{kind}:{dishName}";
                    if (!recipeCache.TryGetValue(cacheKey, out var recipe))
                    {
                        recipe = await _recipes.GetOrGenerateAsync(userId, dishName, servings, kind);
                        recipeCache[cacheKey] = recipe;
                    }
                    slot.RecipeVersionId = recipe.Id;
                    slot.RecipeName = recipe.NameEl;
                    slot.HandsonMinutes = recipe.HandsonMinutes;
                    slot.TotalMinutes = recipe.TotalMinutes;
                    slot.Kind = kind;
                    slot.ReasonSummary ??= dish.Reason;
                    slot.Servings = servings;
                    changed = true;
                }

                if (dish.Slot == MealSlotKind.Dinner)
                    previousDinner = slot;
            }
        }

        return changed;
    }

    private static WeekDish[] MenuFor(DayOfWeek day) => day switch
    {
        DayOfWeek.Monday =>
        [
            new(MealSlotKind.Breakfast, MealKind.NoCook, "Yogurt with honey", "Quick breakfast"),
            new(MealSlotKind.Lunch, MealKind.FreshCook, "Village salad", "Light lunch"),
            new(MealSlotKind.Dinner, MealKind.FreshCook, "Lentil soup", "Main"),
        ],
        DayOfWeek.Tuesday =>
        [
            new(MealSlotKind.Breakfast, MealKind.FreshCook, "Fried eggs", "Protein breakfast"),
            new(MealSlotKind.Lunch, MealKind.Leftovers, "Lentil leftovers", "Use yesterday"),
            new(MealSlotKind.Dinner, MealKind.FreshCook, "Pasta with sauce", "Main"),
        ],
        DayOfWeek.Wednesday =>
        [
            new(MealSlotKind.Breakfast, MealKind.NoCook, "Yogurt with honey", "Quick breakfast"),
            new(MealSlotKind.Lunch, MealKind.FreshCook, "Rice with vegetables", "Lunch"),
            new(MealSlotKind.Dinner, MealKind.FreshCook, "Lemon chicken", "Main"),
        ],
        DayOfWeek.Thursday =>
        [
            new(MealSlotKind.Breakfast, MealKind.FreshCook, "Omelette", "Protein breakfast"),
            new(MealSlotKind.Lunch, MealKind.FreshCook, "Village salad", "Light lunch"),
            new(MealSlotKind.Dinner, MealKind.FreshCook, "Lentil soup", "Main"),
        ],
        DayOfWeek.Friday =>
        [
            new(MealSlotKind.Breakfast, MealKind.NoCook, "Yogurt with honey", "Quick breakfast"),
            new(MealSlotKind.Lunch, MealKind.Leftovers, "Lentil leftovers", "Use yesterday"),
            new(MealSlotKind.Dinner, MealKind.FreshCook, "Pasta with sauce", "Main"),
        ],
        DayOfWeek.Saturday =>
        [
            new(MealSlotKind.Breakfast, MealKind.FreshCook, "Fried eggs", "Saturday breakfast"),
            new(MealSlotKind.Lunch, MealKind.FreshCook, "Village salad", "Light lunch"),
            new(MealSlotKind.Dinner, MealKind.FreshCook, "Lemon chicken", "Main"),
        ],
        _ =>
        [
            new(MealSlotKind.Breakfast, MealKind.NoCook, "Yogurt with honey", "Sunday breakfast"),
            new(MealSlotKind.Lunch, MealKind.FreshCook, "Rice with vegetables", "Lunch"),
            new(MealSlotKind.Dinner, MealKind.FreshCook, "Pasta with sauce", "Main"),
        ]
    };

    private static string BuildStartReminder(MealSlot slot, DateTime today, DateTime nowLocal)
    {
        var mealLocal = slot.Slot switch
        {
            MealSlotKind.Breakfast => today.Date.AddHours(8),
            MealSlotKind.Lunch => today.Date.AddHours(13).AddMinutes(30),
            MealSlotKind.Dinner => today.Date.AddHours(20),
            _ => today.Date.AddHours(17),
        };
        var start = mealLocal.AddMinutes(-(slot.TotalMinutes ?? slot.HandsonMinutes ?? 0));
        return start <= nowLocal
            ? "Start now"
            : $"Start at {start:HH:mm}";
    }

    private async Task<MealPlanDto> MapToDtoAsync(MealPlan plan, string userId)
    {
        var inventoryList = await _inventory.GetInventoryAsync(userId);
        var allInventory = inventoryList.Fridge
            .Concat(inventoryList.Freezer)
            .Concat(inventoryList.Cupboard)
            .ToList();

        var dto = new MealPlanDto
        {
            Id = plan.Id,
            WeekStartDate = plan.WeekStartDate,
            WeekEndDate = plan.WeekEndDate,
            Status = plan.Status.ToString(),
            Version = plan.Version,
            Slots = plan.Slots.Select(MapSlotToDto).ToList(),
        };

        var ids = dto.Slots
            .Select(s => s.RecipeVersionId)
            .Where(id => !string.IsNullOrWhiteSpace(id) && ObjectId.TryParse(id, out _))
            .Cast<string>()
            .Distinct()
            .ToList();

        Dictionary<string, RecipeVersion> recipeMap = new();
        if (ids.Count > 0)
        {
            var recipes = await _context.RecipeVersions
                .Find(Builders<RecipeVersion>.Filter.In(r => r.Id, ids))
                .ToListAsync();
            recipeMap = recipes.ToDictionary(r => r.Id);
        }

        foreach (var slot in dto.Slots)
        {
            RecipeVersion? recipe = null;
            if (slot.RecipeVersionId != null && recipeMap.TryGetValue(slot.RecipeVersionId, out var rv))
                recipe = rv;

            if (recipe != null)
            {
                if (string.IsNullOrWhiteSpace(slot.RecipeName))
                    slot.RecipeName = recipe.NameEl;
                slot.HandsonMinutes ??= recipe.HandsonMinutes;
                slot.TotalMinutes ??= recipe.TotalMinutes;

                var scale = recipe.YieldServings > 0 ? (decimal)slot.Servings / recipe.YieldServings : 1m;
                var diff = IngredientUnits.DiffIngredients(recipe.Ingredients, allInventory, scale);
                slot.MissingIngredients = diff.Missing;
                slot.UncertainIngredients = diff.Uncertain;
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

    private sealed record WeekDish(MealSlotKind Slot, MealKind Kind, string Name, string Reason);
}
