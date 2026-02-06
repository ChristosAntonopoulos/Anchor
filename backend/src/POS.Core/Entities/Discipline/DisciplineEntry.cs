using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Discipline;

/// <summary>
/// Discipline entry - daily discipline state
/// </summary>
public class DisciplineEntry : DayAnchoredEntity
{
    [BsonElement("gym")]
    public bool Gym { get; set; }

    [BsonElement("walk")]
    public bool Walk { get; set; }

    [BsonElement("cooked")]
    public bool Cooked { get; set; }

    [BsonElement("diet")]
    public bool Diet { get; set; }

    [BsonElement("meditation")]
    public bool Meditation { get; set; }

    [BsonElement("water")]
    public bool Water { get; set; }

    [BsonElement("note")]
    public string? Note { get; set; }
}
