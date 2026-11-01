using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Discipline;

/// <summary>
/// Discipline block - groups related discipline items together
/// </summary>
public class DisciplineBlock
{
    [BsonElement("blockId")]
    public string BlockId { get; set; } = string.Empty; // e.g., "75Hard", "HabitTracking"

    [BsonElement("blockName")]
    public string BlockName { get; set; } = string.Empty; // e.g., "75 Hard", "Habit Tracking"

    [BsonElement("items")]
    public List<DisciplineItem> Items { get; set; } = new();

    [BsonElement("order")]
    public int Order { get; set; } // Display order
}
