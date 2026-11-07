using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// AI-generated summary about the previous calendar day, shown on today's Day doc.
/// </summary>
public class YesterdayAssessment
{
    [BsonElement("summary")]
    public string Summary { get; set; } = string.Empty;

    [BsonElement("wins")]
    public List<string> Wins { get; set; } = new();

    [BsonElement("misses")]
    public List<string> Misses { get; set; } = new();

    [BsonElement("carryForward")]
    public List<string> CarryForward { get; set; } = new();

    [BsonElement("moodNote")]
    public string? MoodNote { get; set; }

    [BsonElement("generatedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? GeneratedAt { get; set; }

    [BsonElement("source")]
    public string Source { get; set; } = "day-start";
}
