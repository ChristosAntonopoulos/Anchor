using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// Append-only ledger of quantity changes to inventory batches.
/// Never deleted; reversals use compensating entries.
/// </summary>
public class InventoryMovement : EntityBase
{
    [BsonElement("batchId")]
    public string BatchId { get; set; } = string.Empty;

    [BsonElement("kind")]
    public MovementKind Kind { get; set; }

    [BsonElement("amountDelta")]
    public decimal AmountDelta { get; set; }

    [BsonElement("unit")]
    public string Unit { get; set; } = "g";

    [BsonElement("sourceCommandId")]
    public string? SourceCommandId { get; set; }

    [BsonElement("reversalOfMovementId")]
    public string? ReversalOfMovementId { get; set; }

    [BsonElement("note")]
    public string? Note { get; set; }

    [BsonElement("occurredAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}

public enum MovementKind
{
    Purchased,
    Consumed,
    Discarded,
    Frozen,
    Thawed,
    Correction
}
