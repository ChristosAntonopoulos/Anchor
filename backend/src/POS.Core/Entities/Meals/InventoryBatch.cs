using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// One physical batch of food at home. Two packs of chicken with different dates
/// are two separate batches. Each batch is immutable regarding date facts;
/// corrections create a new version via compensating movements.
/// </summary>
public class InventoryBatch : EntityBase
{
    [BsonElement("ingredientId")]
    public string? IngredientId { get; set; }

    [BsonElement("rawName")]
    public string RawName { get; set; } = string.Empty;

    [BsonElement("form")]
    public string Form { get; set; } = "raw";

    [BsonElement("currentAmount")]
    public decimal CurrentAmount { get; set; }

    [BsonElement("unit")]
    public string Unit { get; set; } = "g";

    [BsonElement("amountIsApproximate")]
    public bool AmountIsApproximate { get; set; } = false;

    [BsonElement("location")]
    public StorageLocation Location { get; set; } = StorageLocation.Fridge;

    [BsonElement("printedDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PrintedDate { get; set; }

    [BsonElement("printedDateText")]
    public string? PrintedDateText { get; set; }

    [BsonElement("dateType")]
    public DateType DateType { get; set; } = DateType.Unknown;

    [BsonElement("openedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? OpenedAt { get; set; }

    [BsonElement("frozenAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? FrozenAt { get; set; }

    [BsonElement("thawedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ThawedAt { get; set; }

    [BsonElement("purchasedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PurchasedAt { get; set; }

    [BsonElement("labelStorageInstructions")]
    public string? LabelStorageInstructions { get; set; }

    [BsonElement("isDiscarded")]
    public bool IsDiscarded { get; set; } = false;

    [BsonElement("isConsumed")]
    public bool IsConsumed { get; set; } = false;

    [BsonElement("confidence")]
    public DataConfidence Confidence { get; set; } = DataConfidence.UserConfirmed;

    [BsonElement("notes")]
    public string? Notes { get; set; }

    [BsonElement("version")]
    public int Version { get; set; } = 1;
}

public enum StorageLocation
{
    Fridge,
    Freezer,
    Cupboard
}

public enum DateType
{
    Unknown,
    UseBy,
    BestBefore,
    NoPrintedDate
}

public enum DataConfidence
{
    UserConfirmed,
    ExtractedReviewPending,
    Approximate
}
