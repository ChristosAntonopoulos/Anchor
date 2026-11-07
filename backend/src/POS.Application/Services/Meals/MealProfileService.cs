using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Meals;
using POS.Core.Entities.Meals;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Meals;

public class MealProfileService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<MealProfileService> _logger;

    public MealProfileService(MongoDbContext context, ILogger<MealProfileService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FoodProfileDto> GetOrCreateProfileAsync(string userId)
    {
        var filter = Builders<FoodProfile>.Filter.Eq(p => p.UserId, userId);
        var profile = await _context.FoodProfiles.Find(filter).FirstOrDefaultAsync();

        if (profile == null)
        {
            profile = new FoodProfile { UserId = userId };
            await _context.FoodProfiles.InsertOneAsync(profile);
            _logger.LogInformation("Created new FoodProfile for user {UserId}", userId);
        }

        return MapToDto(profile);
    }

    public async Task<FoodProfileDto> UpdateProfileAsync(string userId, UpdateFoodProfileRequest request)
    {
        var filter = Builders<FoodProfile>.Filter.Eq(p => p.UserId, userId);
        var profile = await _context.FoodProfiles.Find(filter).FirstOrDefaultAsync();

        if (profile == null)
        {
            profile = new FoodProfile { UserId = userId };
        }
        else if (request.ExpectedVersion > 0 && profile.Version != request.ExpectedVersion)
        {
            throw new POS.Core.Exceptions.BusinessException(
                $"Profile version conflict: expected {request.ExpectedVersion}, current {profile.Version}");
        }

        ApplyUpdates(profile, request);
        profile.Version++;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.FoodProfiles.ReplaceOneAsync(
            filter,
            profile,
            new ReplaceOptions { IsUpsert = true });

        _logger.LogInformation("Updated FoodProfile for user {UserId}, version {Version}", userId, profile.Version);
        return MapToDto(profile);
    }

    private static void ApplyUpdates(FoodProfile profile, UpdateFoodProfileRequest request)
    {
        if (request.DefaultServings.HasValue) profile.DefaultServings = request.DefaultServings.Value;
        if (request.Allergies != null) profile.Allergies = request.Allergies;
        if (request.AllergyStatus != null && Enum.TryParse<AllergyStatus>(request.AllergyStatus, out var allergyStatus))
            profile.AllergyStatus = allergyStatus;
        if (request.DislikedFoods != null) profile.DislikedFoods = request.DislikedFoods;
        if (request.LikedFoods != null) profile.LikedFoods = request.LikedFoods;
        if (request.TypicalWeekdayHandsOnMinutes.HasValue) profile.TypicalWeekdayHandsOnMinutes = request.TypicalWeekdayHandsOnMinutes;
        if (request.AvailableEquipment != null) profile.AvailableEquipment = request.AvailableEquipment;
        if (request.LeftoverPreference != null && Enum.TryParse<LeftoverPreference>(request.LeftoverPreference, out var leftovers))
            profile.LeftoverPreference = leftovers;
        if (request.FreezerUseWelcome.HasValue) profile.FreezerUseWelcome = request.FreezerUseWelcome;
        if (request.ExplorationLevel != null && Enum.TryParse<ExplorationLevel>(request.ExplorationLevel, out var exploration))
            profile.ExplorationLevel = exploration;
        if (request.PreferredShoppingDays != null) profile.PreferredShoppingDays = request.PreferredShoppingDays;
        if (request.ShoppingTripsPerWeek.HasValue) profile.ShoppingTripsPerWeek = request.ShoppingTripsPerWeek;
        if (request.WeeklyBudgetEur.HasValue) profile.WeeklyBudgetEur = request.WeeklyBudgetEur;
        if (request.BudgetFirm.HasValue) profile.BudgetFirm = request.BudgetFirm;
        if (request.SetupComplete.HasValue) profile.SetupComplete = request.SetupComplete.Value;
    }

    private static FoodProfileDto MapToDto(FoodProfile profile) => new()
    {
        Id = profile.Id,
        DefaultServings = profile.DefaultServings,
        Allergies = profile.Allergies,
        AllergyStatus = profile.AllergyStatus.ToString(),
        DislikedFoods = profile.DislikedFoods,
        LikedFoods = profile.LikedFoods,
        TypicalWeekdayHandsOnMinutes = profile.TypicalWeekdayHandsOnMinutes,
        AvailableEquipment = profile.AvailableEquipment,
        LeftoverPreference = profile.LeftoverPreference.ToString(),
        FreezerUseWelcome = profile.FreezerUseWelcome,
        ExplorationLevel = profile.ExplorationLevel.ToString(),
        PreferredShoppingDays = profile.PreferredShoppingDays,
        ShoppingTripsPerWeek = profile.ShoppingTripsPerWeek,
        WeeklyBudgetEur = profile.WeeklyBudgetEur,
        BudgetFirm = profile.BudgetFirm,
        Timezone = profile.Timezone,
        Locale = profile.Locale,
        Version = profile.Version,
        SetupComplete = profile.SetupComplete,
    };
}
