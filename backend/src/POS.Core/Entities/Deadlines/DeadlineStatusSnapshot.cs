using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Deadlines;

/// <summary>
/// Deadline status snapshot - daily status tracking
/// 
/// NOTE: This entity is used by the AI & Scheduling Service for daily deadline status tracking.
/// It is not used by the Data API and may be empty until the AI service is implemented.
/// </summary>
public class DeadlineStatusSnapshot : DayAnchoredEntity
{
    [BsonElement("deadlineId")]
    public string DeadlineId { get; set; } = string.Empty;

    [BsonElement("status")]
    public DeadlineStatus Status { get; set; }

    [BsonElement("message")]
    public string? Message { get; set; }
}
