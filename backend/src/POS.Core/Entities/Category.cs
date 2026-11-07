using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// Category - global categories for tasks and better items
/// </summary>
public class Category : EntityBase
{
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty; // e.g., "work", "leverage"

    [BsonElement("displayName")]
    public string DisplayName { get; set; } = string.Empty; // e.g., "Work", "Leverage"

    [BsonElement("color")]
    public string Color { get; set; } = string.Empty; // hex color code

    [BsonElement("icon")]
    public string? Icon { get; set; } // optional icon name

    [BsonElement("description")]
    public string? Description { get; set; } // optional description

    [BsonElement("order")]
    public int Order { get; set; } // display order

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true; // for soft deletion
}
