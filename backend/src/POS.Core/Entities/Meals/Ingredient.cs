using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// Canonical ingredient dictionary entry. Shared across all users (UserId = "system").
/// Unit conversions and category metadata live here.
/// </summary>
public class Ingredient : EntityBase
{
    [BsonElement("nameEl")]
    public string NameEl { get; set; } = string.Empty;

    [BsonElement("nameEn")]
    public string NameEn { get; set; } = string.Empty;

    [BsonElement("aliases")]
    public List<string> Aliases { get; set; } = new();

    [BsonElement("category")]
    public string Category { get; set; } = string.Empty;

    [BsonElement("defaultUnit")]
    public string DefaultUnit { get; set; } = "g";

    [BsonElement("compatibleForms")]
    public List<string> CompatibleForms { get; set; } = new();

    [BsonElement("commonAllergens")]
    public List<string> CommonAllergens { get; set; } = new();
}
