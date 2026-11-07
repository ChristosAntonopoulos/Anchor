using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.AIBrief;

/// <summary>
/// Written by BotSystem's anchor.day-start bot each morning.
/// Contains the AI-generated daily brief: yesterday's assessment and today's focus.
/// </summary>
public class DayStartPlan : DayAnchoredEntity
{
    /// <summary>
    /// One of: work, leverage, health, stability.
    /// </summary>
    [BsonElement("focusCategory")]
    public string? FocusCategory { get; set; }

    /// <summary>
    /// Whether the user has seen/applied this brief.
    /// </summary>
    [BsonElement("applied")]
    public bool Applied { get; set; }

    [BsonElement("yesterdayAssessment")]
    public YesterdayAssessment? YesterdayAssessment { get; set; }

    [BsonElement("todayFocusTasks")]
    public List<string> TodayFocusTasks { get; set; } = new();
}

public class YesterdayAssessment
{
    [BsonElement("summary")]
    public string? Summary { get; set; }

    [BsonElement("wins")]
    public List<string> Wins { get; set; } = new();

    [BsonElement("misses")]
    public List<string> Misses { get; set; } = new();

    [BsonElement("carryForward")]
    public List<string> CarryForward { get; set; } = new();

    [BsonElement("moodNote")]
    public string? MoodNote { get; set; }

    [BsonElement("dietNote")]
    public string? DietNote { get; set; }

    [BsonElement("generatedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? GeneratedAt { get; set; }

    [BsonElement("source")]
    public string? Source { get; set; }
}
