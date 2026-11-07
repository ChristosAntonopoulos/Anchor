using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// A planned or completed shopping trip linked to a meal plan.
/// </summary>
public class ShoppingTrip : EntityBase
{
    [BsonElement("mealPlanId")]
    public string MealPlanId { get; set; } = string.Empty;

    [BsonElement("plannedDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PlannedDate { get; set; }

    [BsonElement("plannedWindow")]
    public string? PlannedWindow { get; set; }

    [BsonElement("lines")]
    public List<ShoppingLine> Lines { get; set; } = new();

    [BsonElement("status")]
    public ShoppingTripStatus Status { get; set; } = ShoppingTripStatus.Planned;

    [BsonElement("completedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? CompletedAt { get; set; }

    [BsonElement("receiptTotalEur")]
    public decimal? ReceiptTotalEur { get; set; }

    [BsonElement("idempotencyKey")]
    public string? IdempotencyKey { get; set; }
}

public class ShoppingLine
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("ingredientId")]
    public string? IngredientId { get; set; }

    [BsonElement("rawName")]
    public string RawName { get; set; } = string.Empty;

    [BsonElement("requiredAmount")]
    public decimal RequiredAmount { get; set; }

    [BsonElement("unit")]
    public string Unit { get; set; } = "g";

    [BsonElement("suggestedPackSize")]
    public string? SuggestedPackSize { get; set; }

    [BsonElement("whyNeeded")]
    public string? WhyNeeded { get; set; }

    [BsonElement("firstRequiredDate")]
    public string? FirstRequiredDate { get; set; }

    [BsonElement("estimatedPriceEur")]
    public decimal? EstimatedPriceEur { get; set; }

    [BsonElement("priceSource")]
    public string? PriceSource { get; set; }

    [BsonElement("isChecked")]
    public bool IsChecked { get; set; } = false;

    [BsonElement("isUnavailable")]
    public bool IsUnavailable { get; set; } = false;

    [BsonElement("boughtAmount")]
    public decimal? BoughtAmount { get; set; }

    [BsonElement("category")]
    public string? Category { get; set; }

    [BsonElement("isCheckAtHome")]
    public bool IsCheckAtHome { get; set; } = false;
}

public enum ShoppingTripStatus
{
    Planned,
    InProgress,
    Completed
}
