using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Meals;
using POS.Core.Entities.Meals;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Meals;

public class ShoppingService
{
    private readonly MongoDbContext _context;
    private readonly InventoryService _inventory;
    private readonly ILogger<ShoppingService> _logger;

    public ShoppingService(MongoDbContext context, InventoryService inventory, ILogger<ShoppingService> logger)
    {
        _context = context;
        _inventory = inventory;
        _logger = logger;
    }

    public async Task<ShoppingTripDto?> GetActiveTripAsync(string userId, string planId)
    {
        var filter = Builders<ShoppingTrip>.Filter.And(
            Builders<ShoppingTrip>.Filter.Eq(t => t.UserId, userId),
            Builders<ShoppingTrip>.Filter.Eq(t => t.MealPlanId, planId),
            Builders<ShoppingTrip>.Filter.In(t => t.Status,
                new[] { ShoppingTripStatus.Planned, ShoppingTripStatus.InProgress }));

        var trip = await _context.ShoppingTrips.Find(filter)
            .SortByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        return trip == null ? null : MapToDto(trip);
    }

    public async Task<ShoppingTripDto> GenerateTripAsync(string userId, string planId)
    {
        var planFilter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.Id, planId),
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId));
        var plan = await _context.MealPlans.Find(planFilter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Meal plan not found.");

        var inventoryList = await _inventory.GetInventoryAsync(userId);
        var allInventory = inventoryList.Fridge
            .Concat(inventoryList.Freezer)
            .Concat(inventoryList.Cupboard)
            .ToList();

        var recipeIds = plan.Slots
            .Where(s => !string.IsNullOrWhiteSpace(s.RecipeVersionId))
            .Select(s => s.RecipeVersionId!)
            .Distinct()
            .ToList();
        var recipeNames = plan.Slots
            .Where(s => !string.IsNullOrWhiteSpace(s.RecipeName))
            .Select(s => s.RecipeName!)
            .Distinct()
            .ToList();

        var recipeClauses = new List<FilterDefinition<RecipeVersion>>
        {
            Builders<RecipeVersion>.Filter.Eq(r => r.UserId, userId),
            Builders<RecipeVersion>.Filter.Eq(r => r.UserId, "system")
        };
        if (recipeIds.Count > 0)
            recipeClauses.Add(Builders<RecipeVersion>.Filter.In(r => r.Id, recipeIds));
        if (recipeNames.Count > 0)
        {
            recipeClauses.Add(Builders<RecipeVersion>.Filter.In(r => r.NameEl, recipeNames));
            recipeClauses.Add(Builders<RecipeVersion>.Filter.In(r => r.NameEn, recipeNames));
        }

        var recipeFilter = Builders<RecipeVersion>.Filter.And(
            Builders<RecipeVersion>.Filter.Eq(r => r.IsActive, true),
            Builders<RecipeVersion>.Filter.Or(recipeClauses));
        var recipes = await _context.RecipeVersions.Find(recipeFilter).ToListAsync();
        var recipeMap = recipes
            .GroupBy(r => r.Id)
            .ToDictionary(g => g.Key, g => g.First());

        var lines = CalculateShoppingLines(plan.Slots, recipeMap, allInventory);

        var archiveFilter = Builders<ShoppingTrip>.Filter.And(
            Builders<ShoppingTrip>.Filter.Eq(t => t.UserId, userId),
            Builders<ShoppingTrip>.Filter.Eq(t => t.MealPlanId, planId),
            Builders<ShoppingTrip>.Filter.In(t => t.Status,
                new[] { ShoppingTripStatus.Planned, ShoppingTripStatus.InProgress }));
        await _context.ShoppingTrips.UpdateManyAsync(archiveFilter,
            Builders<ShoppingTrip>.Update.Set(t => t.Status, ShoppingTripStatus.Completed));

        var trip = new ShoppingTrip
        {
            UserId = userId,
            MealPlanId = planId,
            Status = ShoppingTripStatus.Planned,
            Lines = lines,
        };

        await _context.ShoppingTrips.InsertOneAsync(trip);
        _logger.LogInformation("Generated shopping trip {TripId} for plan {PlanId}", trip.Id, planId);
        return MapToDto(trip);
    }

    public async Task UpdateLineAsync(string userId, string tripId, UpdateShoppingLineRequest request)
    {
        var filter = Builders<ShoppingTrip>.Filter.And(
            Builders<ShoppingTrip>.Filter.Eq(t => t.Id, tripId),
            Builders<ShoppingTrip>.Filter.Eq(t => t.UserId, userId));

        var trip = await _context.ShoppingTrips.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Shopping trip not found.");

        var line = trip.Lines.FirstOrDefault(l => l.Id == request.LineId)
            ?? throw new NotFoundException("Shopping line not found.");

        if (request.IsChecked.HasValue) line.IsChecked = request.IsChecked.Value;
        if (request.IsUnavailable.HasValue) line.IsUnavailable = request.IsUnavailable.Value;
        if (request.BoughtAmount.HasValue) line.BoughtAmount = request.BoughtAmount;

        await _context.ShoppingTrips.ReplaceOneAsync(filter, trip);
    }

    public async Task FinishTripAsync(string userId, FinishShoppingRequest request)
    {
        var filter = Builders<ShoppingTrip>.Filter.And(
            Builders<ShoppingTrip>.Filter.Eq(t => t.Id, request.TripId),
            Builders<ShoppingTrip>.Filter.Eq(t => t.UserId, userId));

        var trip = await _context.ShoppingTrips.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Shopping trip not found.");

        if (trip.Status == ShoppingTripStatus.Completed)
            throw new BusinessException("Trip already completed. Use idempotency key to prevent double submission.");

        foreach (var lineUpdate in request.Lines)
        {
            var line = trip.Lines.FirstOrDefault(l => l.Id == lineUpdate.LineId);
            if (line == null) continue;
            line.IsChecked = lineUpdate.IsChecked;
            line.IsUnavailable = lineUpdate.IsUnavailable;
            if (lineUpdate.BoughtAmount.HasValue) line.BoughtAmount = lineUpdate.BoughtAmount;
        }

        trip.Status = ShoppingTripStatus.Completed;
        trip.CompletedAt = DateTime.UtcNow;
        trip.ReceiptTotalEur = request.ReceiptTotalEur;
        trip.UpdatedAt = DateTime.UtcNow;

        await _context.ShoppingTrips.ReplaceOneAsync(filter, trip);

        // Create inventory batches for checked items
        foreach (var line in trip.Lines.Where(l => l.IsChecked && !l.IsUnavailable))
        {
            await _inventory.AddBatchAsync(userId, new AddInventoryBatchRequest
            {
                RawName = line.RawName,
                IngredientId = line.IngredientId,
                Amount = line.BoughtAmount ?? line.RequiredAmount,
                Unit = line.Unit,
                Location = "Fridge",
                PurchasedAt = DateTime.UtcNow,
                DateType = "Unknown",
                IdempotencyKey = $"trip-{trip.Id}-line-{line.Id}",
            });
        }

        _logger.LogInformation("Finished shopping trip {TripId} for user {UserId}", trip.Id, userId);
    }

    private static List<ShoppingLine> CalculateShoppingLines(
        List<MealSlot> slots,
        Dictionary<string, RecipeVersion> recipeMap,
        List<InventoryBatchDto> inventory)
    {
        var demands = new Dictionary<string, (decimal amount, string unit, List<string> reasons)>(StringComparer.OrdinalIgnoreCase);

        foreach (var slot in slots.Where(s => s.State == MealSlotState.Planned))
        {
            var recipe = ResolveRecipe(slot, recipeMap);
            var reason = $"{slot.LocalDate} {slot.Slot}";

            if (recipe == null)
            {
                var fallbackName = string.IsNullOrWhiteSpace(slot.RecipeName) ? null : slot.RecipeName.Trim();
                if (fallbackName == null) continue;
                AddDemand(demands, fallbackName, 1m, "item", reason);
                continue;
            }

            var scaleFactor = recipe.YieldServings > 0 ? (decimal)slot.Servings / recipe.YieldServings : 1m;
            var ingredients = recipe.Ingredients
                .Where(i => !string.IsNullOrWhiteSpace(i.RawName) && !i.IsOptional)
                .ToList();

            if (ingredients.Count == 0)
            {
                AddDemand(demands, recipe.NameEl, 1m, "item", reason);
                continue;
            }

            foreach (var ingredient in ingredients)
            {
                var scaledAmount = (ingredient.Amount ?? 1m) * scaleFactor;
                AddDemand(demands, ingredient.RawName, scaledAmount, ingredient.Unit ?? "unit", reason);
            }
        }

        var lines = new List<ShoppingLine>();
        foreach (var (key, demand) in demands)
        {
            var parts = key.Split('|');
            var rawName = parts[0];
            var unit = parts.Length > 1 ? parts[1] : "unit";

            var availableAmount = inventory
                .Where(b => b.RawName.Equals(rawName, StringComparison.OrdinalIgnoreCase) && b.Unit == unit)
                .Sum(b => b.CurrentAmount);

            var toBuy = Math.Max(0, demand.amount - availableAmount);
            if (toBuy <= 0) continue;

            lines.Add(new ShoppingLine
            {
                RawName = rawName,
                RequiredAmount = Math.Round(toBuy, 0),
                Unit = unit,
                WhyNeeded = string.Join(", ", demand.reasons),
                IsCheckAtHome = availableAmount > 0,
            });
        }

        return lines;
    }

    private static RecipeVersion? ResolveRecipe(MealSlot slot, Dictionary<string, RecipeVersion> recipeMap)
    {
        if (!string.IsNullOrWhiteSpace(slot.RecipeVersionId) &&
            recipeMap.TryGetValue(slot.RecipeVersionId, out var byId))
            return byId;

        if (string.IsNullOrWhiteSpace(slot.RecipeName))
            return null;

        return recipeMap.Values.FirstOrDefault(r =>
            r.NameEl.Equals(slot.RecipeName, StringComparison.OrdinalIgnoreCase) ||
            r.NameEn.Equals(slot.RecipeName, StringComparison.OrdinalIgnoreCase));
    }

    private static void AddDemand(
        Dictionary<string, (decimal amount, string unit, List<string> reasons)> demands,
        string rawName,
        decimal amount,
        string unit,
        string reason)
    {
        var key = $"{rawName.Trim().ToLowerInvariant()}|{unit}";
        if (demands.TryGetValue(key, out var existing))
        {
            demands[key] = (existing.amount + amount, existing.unit,
                existing.reasons.Concat(new[] { reason }).Distinct().ToList());
        }
        else
        {
            demands[key] = (amount, unit, new List<string> { reason });
        }
    }

    private static ShoppingTripDto MapToDto(ShoppingTrip trip)
    {
        var confirmedTotal = trip.Lines
            .Where(l => l.EstimatedPriceEur.HasValue && !l.IsUnavailable)
            .Sum(l => l.EstimatedPriceEur!.Value);

        return new ShoppingTripDto
        {
            Id = trip.Id,
            MealPlanId = trip.MealPlanId,
            PlannedDate = trip.PlannedDate,
            PlannedWindow = trip.PlannedWindow,
            Status = trip.Status.ToString(),
            CompletedAt = trip.CompletedAt,
            ReceiptTotalEur = trip.ReceiptTotalEur,
            ConfirmedPriceTotal = confirmedTotal > 0 ? confirmedTotal : null,
            UnpricedItems = trip.Lines.Count(l => !l.EstimatedPriceEur.HasValue),
            Lines = trip.Lines.Select(l => new ShoppingLineDto
            {
                Id = l.Id,
                IngredientId = l.IngredientId,
                RawName = l.RawName,
                RequiredAmount = l.RequiredAmount,
                Unit = l.Unit,
                SuggestedPackSize = l.SuggestedPackSize,
                WhyNeeded = l.WhyNeeded,
                FirstRequiredDate = l.FirstRequiredDate,
                EstimatedPriceEur = l.EstimatedPriceEur,
                PriceSource = l.PriceSource,
                IsChecked = l.IsChecked,
                IsUnavailable = l.IsUnavailable,
                BoughtAmount = l.BoughtAmount,
                Category = l.Category,
                IsCheckAtHome = l.IsCheckAtHome,
            }).ToList(),
        };
    }
}
