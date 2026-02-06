using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Schedule;

/// <summary>
/// Schedule block instance - daily concrete schedule block
/// </summary>
public class ScheduleBlockInstance : DayAnchoredEntity
{
    [BsonElement("definitionId")]
    public string DefinitionId { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("startTime")]
    public string StartTime { get; set; } = string.Empty; // HH:mm format

    [BsonElement("endTime")]
    public string EndTime { get; set; } = string.Empty; // HH:mm format

    [BsonElement("locked")]
    public bool Locked { get; set; }

    [BsonElement("source")]
    public string Source { get; set; } = "user"; // ai|user
}

public enum InstanceSource
{
    AI,
    User
}
