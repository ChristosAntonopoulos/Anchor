using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.CBT;

/// <summary>
/// Mood Entry - Daily mood tracking
/// </summary>
[BsonIgnoreExtraElements]
public class MoodEntry : EntityBase
{
    [BsonElement("date")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime Date { get; set; } // Date of mood entry

    [BsonElement("mood")]
    public string Mood { get; set; } = string.Empty; // Primary mood

    [BsonElement("intensity")]
    public int Intensity { get; set; } // 0-10 scale

    [BsonElement("notes")]
    public string? Notes { get; set; } // Optional notes

    [BsonElement("triggers")]
    public List<string>? Triggers { get; set; } // What triggered this mood

    [BsonElement("activities")]
    public List<string>? Activities { get; set; } // Activities done that day
}
