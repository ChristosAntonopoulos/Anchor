using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// Stores the user's food preferences, restrictions, and cooking habits.
/// One per user; versioned to detect stale AI proposals.
/// </summary>
public class FoodProfile : EntityBase
{
    [BsonElement("defaultServings")]
    public int DefaultServings { get; set; } = 1;

    /// <summary>Null = not yet asked; empty list = none known</summary>
    [BsonElement("allergies")]
    public List<string>? Allergies { get; set; }

    [BsonElement("allergyStatus")]
    public AllergyStatus AllergyStatus { get; set; } = AllergyStatus.Unknown;

    [BsonElement("dislikedFoods")]
    public List<string> DislikedFoods { get; set; } = new();

    [BsonElement("likedFoods")]
    public List<string> LikedFoods { get; set; } = new();

    /// <summary>Minutes of hands-on cooking time the user is comfortable with on a typical weekday</summary>
    [BsonElement("typicalWeekdayHandsOnMinutes")]
    public int? TypicalWeekdayHandsOnMinutes { get; set; }

    [BsonElement("availableEquipment")]
    public List<string> AvailableEquipment { get; set; } = new();

    [BsonElement("leftoverPreference")]
    public LeftoverPreference LeftoverPreference { get; set; } = LeftoverPreference.Unknown;

    [BsonElement("freezerUseWelcome")]
    public bool? FreezerUseWelcome { get; set; }

    [BsonElement("explorationLevel")]
    public ExplorationLevel ExplorationLevel { get; set; } = ExplorationLevel.MostlyFamiliar;

    [BsonElement("preferredShoppingDays")]
    public List<string> PreferredShoppingDays { get; set; } = new();

    [BsonElement("shoppingTripsPerWeek")]
    public int? ShoppingTripsPerWeek { get; set; }

    [BsonElement("weeklyBudgetEur")]
    public decimal? WeeklyBudgetEur { get; set; }

    [BsonElement("budgetFirm")]
    public bool? BudgetFirm { get; set; }

    [BsonElement("timezone")]
    public string Timezone { get; set; } = "Europe/Athens";

    [BsonElement("locale")]
    public string Locale { get; set; } = "en-GB";

    [BsonElement("version")]
    public int Version { get; set; } = 1;

    [BsonElement("setupComplete")]
    public bool SetupComplete { get; set; } = false;
}

public enum AllergyStatus
{
    Unknown,
    NoneKnown,
    HasRestrictions
}

public enum LeftoverPreference
{
    Unknown,
    HappyToRepeat,
    OneRepeat,
    PreferFresh
}

public enum ExplorationLevel
{
    MostlyFamiliar,
    Mixed,
    Explore
}
