using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Tasks;

/// <summary>
/// Subtask - checklist item within a task
/// </summary>
public class Subtask
{
    [BsonElement("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("completed")]
    public bool Completed { get; set; }

    [BsonElement("order")]
    public int? Order { get; set; }
}
