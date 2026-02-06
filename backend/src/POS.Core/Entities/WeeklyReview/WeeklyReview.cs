using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.WeeklyReview;

/// <summary>
/// Weekly review - weekly AI-generated summary and user reflection
/// </summary>
public class WeeklyReview : EntityBase
{
    [BsonElement("weekId")]
    public string WeekId { get; set; } = string.Empty; // YYYY-WW format

    [BsonElement("aiSummary")]
    public string AiSummary { get; set; } = string.Empty;

    [BsonElement("shipped")]
    public string? Shipped { get; set; }

    [BsonElement("improved")]
    public string? Improved { get; set; }

    [BsonElement("avoided")]
    public string? Avoided { get; set; }

    [BsonElement("nextFocus")]
    public string? NextFocus { get; set; }

    [BsonElement("completed")]
    public bool Completed { get; set; }

    [BsonElement("completedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? CompletedAt { get; set; }
}
