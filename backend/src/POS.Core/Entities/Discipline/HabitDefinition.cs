using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Discipline;

/// <summary>
/// Habit / discipline item template. Daily entries are generated from active definitions only.
/// </summary>
[BsonIgnoreExtraElements]
public class HabitDefinition : DefinitionEntity
{
    [BsonElement("key")]
    public string Key { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("frequency")]
    public HabitFrequency Frequency { get; set; } = HabitFrequency.Daily;

    [BsonElement("itemId")]
    public string ItemId { get; set; } = string.Empty;

    [BsonElement("itemName")]
    public string ItemName { get; set; } = string.Empty;

    [BsonElement("itemType")]
    public DisciplineItemType ItemType { get; set; } = DisciplineItemType.Toggle;

    [BsonElement("blockId")]
    public string BlockId { get; set; } = "HabitTracking";

    [BsonElement("blockName")]
    public string BlockName { get; set; } = "Habit Tracking";

    [BsonElement("blockOrder")]
    public int BlockOrder { get; set; }

    /// <summary>When false the habit is paused and excluded from daily generation.</summary>
    [BsonElement("active")]
    public bool Active { get; set; } = true;

    /// <summary>0=Sun … 6=Sat. Null or empty means every day.</summary>
    [BsonElement("daysOfWeek")]
    public int[]? DaysOfWeek { get; set; }

    [BsonElement("order")]
    public int Order { get; set; }

    /// <summary>Coffee/Cigarettes and similar — cannot be deleted via assistant API.</summary>
    [BsonElement("protected")]
    public bool Protected { get; set; }
}

public enum HabitFrequency
{
    Daily,
    Weekly
}
