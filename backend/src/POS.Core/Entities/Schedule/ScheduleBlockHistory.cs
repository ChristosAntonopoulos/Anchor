using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Schedule;

/// <summary>
/// Schedule block history - tracks completion of schedule blocks
/// 
/// NOTE: This entity is used by the AI & Scheduling Service for completion tracking and optimization.
/// It is not used by the Data API and may be empty until the AI service is implemented.
/// </summary>
public class ScheduleBlockHistory : DayAnchoredEntity
{
    [BsonElement("definitionId")]
    public string DefinitionId { get; set; } = string.Empty;

    [BsonElement("instanceId")]
    public string InstanceId { get; set; } = string.Empty;

    [BsonElement("outcome")]
    public ScheduleOutcome Outcome { get; set; }

    [BsonElement("note")]
    public string? Note { get; set; }
}

public enum ScheduleOutcome
{
    Completed,
    Skipped,
    Partial
}
