using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// Output from anchor.day-start before it is merged onto the Day document.
/// </summary>
public class DayStartPlan : EntityBase
{
    [BsonElement("date")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc, DateOnly = true)]
    public DateTime Date { get; set; }

    [BsonElement("yesterdayAssessment")]
    public YesterdayAssessment? YesterdayAssessment { get; set; }

    [BsonElement("focusCategory")]
    public string? FocusCategory { get; set; }

    [BsonElement("applied")]
    public bool Applied { get; set; }

    [BsonElement("error")]
    public string? Error { get; set; }
}
