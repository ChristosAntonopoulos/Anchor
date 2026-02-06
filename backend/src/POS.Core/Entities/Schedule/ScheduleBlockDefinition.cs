using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Schedule;

/// <summary>
/// Schedule block definition - template/rule for schedule blocks
/// </summary>
public class ScheduleBlockDefinition : DefinitionEntity
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("kind")]
    public ScheduleBlockKind Kind { get; set; }

    [BsonElement("recurrence")]
    public RecurrenceType Recurrence { get; set; } = RecurrenceType.None;

    [BsonElement("daysOfWeek")]
    public int[]? DaysOfWeek { get; set; } // 0-6 array for weekly recurrence

    [BsonElement("minPerWeek")]
    public int? MinPerWeek { get; set; }

    [BsonElement("maxPerWeek")]
    public int? MaxPerWeek { get; set; }

    [BsonElement("fixedStartTime")]
    public string? FixedStartTime { get; set; } // HH:mm format

    [BsonElement("fixedEndTime")]
    public string? FixedEndTime { get; set; } // HH:mm format

    [BsonElement("preferredTimeTag")]
    public string? PreferredTimeTag { get; set; } // morning|afternoon|evening

    [BsonElement("durationMinutes")]
    public int? DurationMinutes { get; set; }

    [BsonElement("energy")]
    public EnergyLevel Energy { get; set; } = EnergyLevel.Medium;

    [BsonElement("tags")]
    public string[] Tags { get; set; } = Array.Empty<string>();
}

public enum ScheduleBlockKind
{
    Fixed,
    Flexible,
    Recurring
}

public enum RecurrenceType
{
    None,
    Daily,
    Weekly
}

public enum EnergyLevel
{
    Low,
    Medium,
    High
}
