using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Schedule;

/// <summary>
/// Persisted morning/night routine (steps + window + mode trigger). Seeded from catalog only if missing.
/// </summary>
[BsonIgnoreExtraElements]
public class RoutineDefinition : DefinitionEntity
{
    /// <summary>morning | night</summary>
    [BsonElement("key")]
    public string Key { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("startTime")]
    public string StartTime { get; set; } = "07:00";

    [BsonElement("endTime")]
    public string EndTime { get; set; } = "07:45";

    [BsonElement("triggerHour")]
    public int TriggerHour { get; set; }

    [BsonElement("triggerMinute")]
    public int TriggerMinute { get; set; }

    [BsonElement("totalSeconds")]
    public int TotalSeconds { get; set; }

    [BsonElement("catalogVersion")]
    public string CatalogVersion { get; set; } = string.Empty;

    [BsonElement("steps")]
    public List<RoutineStepData> Steps { get; set; } = [];

    [BsonElement("shorterSteps")]
    public List<RoutineStepData> ShorterSteps { get; set; } = [];
}

[BsonIgnoreExtraElements]
public class RoutineStepData
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("seconds")]
    public int Seconds { get; set; }

    [BsonElement("command")]
    public string Command { get; set; } = string.Empty;

    [BsonElement("order")]
    public int Order { get; set; }
}
