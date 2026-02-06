using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.BetterToday;

/// <summary>
/// Better item event - audit log for better item changes
/// 
/// NOTE: This entity is used by the AI & Scheduling Service for audit logging.
/// It is not used by the Data API and may be empty until the AI service is implemented.
/// </summary>
public class BetterItemEvent : EntityBase
{
    [BsonElement("betterItemId")]
    public string BetterItemId { get; set; } = string.Empty;

    [BsonElement("eventType")]
    public BetterItemEventType EventType { get; set; }

    [BsonElement("at")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime At { get; set; } = DateTime.UtcNow;

    [BsonElement("payload")]
    public Dictionary<string, object>? Payload { get; set; }
}

public enum BetterItemEventType
{
    Created,
    Completed,
    Edited,
    Deleted
}
