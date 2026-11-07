using POS.Core.Entities.Meals;

namespace POS.Application.DTOs.Meals;

public class FoodProfileDto
{
    public string Id { get; set; } = string.Empty;
    public int DefaultServings { get; set; } = 1;
    public List<string>? Allergies { get; set; }
    public string AllergyStatus { get; set; } = "Unknown";
    public List<string> DislikedFoods { get; set; } = new();
    public List<string> LikedFoods { get; set; } = new();
    public int? TypicalWeekdayHandsOnMinutes { get; set; }
    public List<string> AvailableEquipment { get; set; } = new();
    public string LeftoverPreference { get; set; } = "Unknown";
    public bool? FreezerUseWelcome { get; set; }
    public string ExplorationLevel { get; set; } = "MostlyFamiliar";
    public List<string> PreferredShoppingDays { get; set; } = new();
    public int? ShoppingTripsPerWeek { get; set; }
    public decimal? WeeklyBudgetEur { get; set; }
    public bool? BudgetFirm { get; set; }
    public string Timezone { get; set; } = "Europe/Athens";
    public string Locale { get; set; } = "el-GR";
    public int Version { get; set; } = 1;
    public bool SetupComplete { get; set; } = false;
}

public class UpdateFoodProfileRequest
{
    public int? DefaultServings { get; set; }
    public List<string>? Allergies { get; set; }
    public string? AllergyStatus { get; set; }
    public List<string>? DislikedFoods { get; set; }
    public List<string>? LikedFoods { get; set; }
    public int? TypicalWeekdayHandsOnMinutes { get; set; }
    public List<string>? AvailableEquipment { get; set; }
    public string? LeftoverPreference { get; set; }
    public bool? FreezerUseWelcome { get; set; }
    public string? ExplorationLevel { get; set; }
    public List<string>? PreferredShoppingDays { get; set; }
    public int? ShoppingTripsPerWeek { get; set; }
    public decimal? WeeklyBudgetEur { get; set; }
    public bool? BudgetFirm { get; set; }
    public bool? SetupComplete { get; set; }
    public int ExpectedVersion { get; set; } = 0;
}
