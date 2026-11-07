using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// A weekly meal plan containing multiple MealSlots.
/// One active plan per week per user.
/// </summary>
public class MealPlan : EntityBase
{
    [BsonElement("weekStartDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime WeekStartDate { get; set; }

    [BsonElement("weekEndDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime WeekEndDate { get; set; }

    [BsonElement("slots")]
    public List<MealSlot> Slots { get; set; } = new();

    [BsonElement("status")]
    public MealPlanStatus Status { get; set; } = MealPlanStatus.Draft;

    [BsonElement("profileVersionUsed")]
    public int ProfileVersionUsed { get; set; }

    [BsonElement("aiProposalId")]
    public string? AiProposalId { get; set; }

    [BsonElement("version")]
    public int Version { get; set; } = 1;
}

public class MealSlot
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("localDate")]
    public string LocalDate { get; set; } = string.Empty;

    [BsonElement("slot")]
    public MealSlotKind Slot { get; set; } = MealSlotKind.Dinner;

    [BsonElement("kind")]
    public MealKind Kind { get; set; } = MealKind.FreshCook;

    [BsonElement("recipeVersionId")]
    public string? RecipeVersionId { get; set; }

    [BsonElement("recipeName")]
    public string? RecipeName { get; set; }

    [BsonElement("servings")]
    public int Servings { get; set; } = 1;

    [BsonElement("locked")]
    public bool Locked { get; set; } = false;

    [BsonElement("sourceMealSlotId")]
    public string? SourceMealSlotId { get; set; }

    [BsonElement("reasonSummary")]
    public string? ReasonSummary { get; set; }

    [BsonElement("handsonMinutes")]
    public int? HandsonMinutes { get; set; }

    [BsonElement("totalMinutes")]
    public int? TotalMinutes { get; set; }

    [BsonElement("state")]
    public MealSlotState State { get; set; } = MealSlotState.Planned;

    [BsonElement("cookEventId")]
    public string? CookEventId { get; set; }
}

public enum MealSlotKind
{
    Breakfast,
    Lunch,
    Dinner,
    Snack
}

public enum MealKind
{
    FreshCook,
    Leftovers,
    FrozenPortion,
    NoCook,
    EatingOut
}

public enum MealSlotState
{
    Planned,
    Cooked,
    PartlyCooked,
    Skipped,
    EatingOut
}

public enum MealPlanStatus
{
    Draft,
    Active,
    Archived
}
