using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Money;

/// <summary>
/// Money insight - weekly AI-generated money trends
/// 
/// NOTE: This entity is written by the AI & Scheduling Service for weekly money trend insights.
/// It is not used by the Data API and may be empty until the AI service is implemented.
/// </summary>
public class MoneyInsight : EntityBase
{
    [BsonElement("weekId")]
    public string WeekId { get; set; } = string.Empty; // YYYY-WW format

    [BsonElement("trend")]
    public MoneyTrend Trend { get; set; }

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;
}

public enum MoneyTrend
{
    Up,
    Flat,
    Down
}
