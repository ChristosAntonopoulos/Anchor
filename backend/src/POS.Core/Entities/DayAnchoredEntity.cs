using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// Base class for entities that are anchored to a specific day
/// </summary>
public abstract class DayAnchoredEntity : EntityBase
{
    [BsonElement("date")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc, DateOnly = true)]
    public DateTime Date { get; set; }

    /// <summary>
    /// Composite key for day-anchored entities: {UserId}_{Date:yyyy-MM-dd}
    /// </summary>
    [BsonIgnore]
    public string DayId => $"{UserId}_{Date:yyyy-MM-dd}";
}
