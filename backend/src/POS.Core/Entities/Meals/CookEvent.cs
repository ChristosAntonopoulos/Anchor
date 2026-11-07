using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// Records what actually happened when a meal was cooked.
/// Completing a cook event creates inventory movements for consumed
/// ingredients and new LeftoverBatches atomically.
/// </summary>
public class CookEvent : EntityBase
{
    [BsonElement("mealSlotId")]
    public string MealSlotId { get; set; } = string.Empty;

    [BsonElement("recipeVersionId")]
    public string? RecipeVersionId { get; set; }

    [BsonElement("outcome")]
    public CookOutcome Outcome { get; set; } = CookOutcome.Cooked;

    [BsonElement("actualServings")]
    public int? ActualServings { get; set; }

    [BsonElement("cookedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? CookedAt { get; set; }

    [BsonElement("actualHandsonMinutes")]
    public int? ActualHandsonMinutes { get; set; }

    [BsonElement("ingredientAdjustments")]
    public List<IngredientAdjustment> IngredientAdjustments { get; set; } = new();

    [BsonElement("storedPortions")]
    public List<StoredPortion> StoredPortions { get; set; } = new();

    [BsonElement("feedbackMakeAgain")]
    public MakeAgainChoice? FeedbackMakeAgain { get; set; }

    [BsonElement("feedbackReason")]
    public string? FeedbackReason { get; set; }

    [BsonElement("idempotencyKey")]
    public string? IdempotencyKey { get; set; }
}

public class IngredientAdjustment
{
    [BsonElement("ingredientId")]
    public string? IngredientId { get; set; }

    [BsonElement("rawName")]
    public string RawName { get; set; } = string.Empty;

    [BsonElement("amountUsed")]
    public decimal? AmountUsed { get; set; }

    [BsonElement("unit")]
    public string? Unit { get; set; }

    [BsonElement("batchId")]
    public string? BatchId { get; set; }
}

public class StoredPortion
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("portions")]
    public decimal Portions { get; set; }

    [BsonElement("location")]
    public StorageLocation Location { get; set; } = StorageLocation.Fridge;

    [BsonElement("storedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? StoredAt { get; set; }

    [BsonElement("inventoryBatchId")]
    public string? InventoryBatchId { get; set; }
}

public enum CookOutcome
{
    Cooked,
    PartlyCooked,
    DidNotCook
}

public enum MakeAgainChoice
{
    Yes,
    WithChanges,
    NotForMe
}
