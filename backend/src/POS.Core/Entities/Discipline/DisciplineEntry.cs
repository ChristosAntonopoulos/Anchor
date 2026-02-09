using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Discipline;

/// <summary>
/// Discipline entry - daily discipline state
/// </summary>
public class DisciplineEntry : DayAnchoredEntity
{
    [BsonElement("blocks")]
    public List<DisciplineBlock> Blocks { get; set; } = new();

    [BsonElement("note")]
    public string? Note { get; set; }
}
