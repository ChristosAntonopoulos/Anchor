using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Tasks;

/// <summary>
/// RecurrencePattern - defines how a task repeats
/// </summary>
public class RecurrencePattern
{
    [BsonElement("type")]
    public string Type { get; set; } = string.Empty; // daily|weekly|monthly|yearly

    [BsonElement("interval")]
    public int? Interval { get; set; } // Every N days/weeks/months (default: 1)

    [BsonElement("daysOfWeek")]
    public List<int>? DaysOfWeek { get; set; } // For weekly: [1,3,5] = Mon,Wed,Fri (0=Sunday, 1=Monday, etc.)

    [BsonElement("dayOfMonth")]
    public int? DayOfMonth { get; set; } // For monthly: day 15

    [BsonElement("endDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? EndDate { get; set; } // Optional end date

    [BsonElement("occurrenceCount")]
    public int? OccurrenceCount { get; set; } // Repeat N times
}
