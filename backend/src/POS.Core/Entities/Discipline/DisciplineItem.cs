using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Discipline;

/// <summary>
/// Discipline item - represents a single discipline task (toggle or counter)
/// </summary>
public class DisciplineItem
{
    [BsonElement("itemId")]
    public string ItemId { get; set; } = string.Empty;

    [BsonElement("itemName")]
    public string ItemName { get; set; } = string.Empty;

    [BsonElement("type")]
    public DisciplineItemType Type { get; set; }

    [BsonElement("toggleValue")]
    public bool? ToggleValue { get; set; } // Value if type is Toggle

    [BsonElement("counterValue")]
    public int? CounterValue { get; set; } // Value if type is Counter
}
