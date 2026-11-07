using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// Stores AI-proposed and user-confirmed preference memories.
/// Scoped by duration (stable / this-week / observation).
/// </summary>
public class PreferenceMemory : EntityBase
{
    [BsonElement("key")]
    public string Key { get; set; } = string.Empty;

    [BsonElement("value")]
    public string Value { get; set; } = string.Empty;

    [BsonElement("scope")]
    public MemoryScope Scope { get; set; } = MemoryScope.Stable;

    [BsonElement("isConfirmed")]
    public bool IsConfirmed { get; set; } = false;

    [BsonElement("evidenceIds")]
    public List<string> EvidenceIds { get; set; } = new();

    [BsonElement("reason")]
    public string? Reason { get; set; }

    [BsonElement("expiresAfter")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ExpiresAfter { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("version")]
    public int Version { get; set; } = 1;
}

public enum MemoryScope
{
    Stable,
    ThisWeek,
    Observation
}
