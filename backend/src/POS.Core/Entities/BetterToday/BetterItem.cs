using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.BetterToday;

/// <summary>
/// Better item - daily focus items that make the user better
/// </summary>
public class BetterItem : DayAnchoredEntity
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability

    [BsonElement("completed")]
    public bool Completed { get; set; }

    [BsonElement("source")]
    public string Source { get; set; } = "ai"; // ai|user
}
