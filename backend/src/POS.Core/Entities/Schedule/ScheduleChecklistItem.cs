using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Schedule;

/// <summary>
/// Timed checklist step within a daily schedule block instance.
/// </summary>
public class ScheduleChecklistItem
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>Allocated minutes for this step (interval timer).</summary>
    [BsonElement("durationMinutes")]
    public int DurationMinutes { get; set; } = 10;

    [BsonElement("completed")]
    public bool Completed { get; set; }

    [BsonElement("order")]
    public int Order { get; set; }
}
