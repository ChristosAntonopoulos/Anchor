using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Tasks;

/// <summary>
/// Task - daily execution tasks
/// </summary>
public class Task : DayAnchoredEntity
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability

    [BsonElement("completed")]
    public bool Completed { get; set; }

    [BsonElement("source")]
    public string Source { get; set; } = "user"; // ai|user
}
