using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Deadlines;

/// <summary>
/// Deadline - active deadline
/// </summary>
public class Deadline : EntityBase
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("dueDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime DueDate { get; set; }

    [BsonElement("importance")]
    public int Importance { get; set; } = 3; // 1-5

    [BsonElement("status")]
    public DeadlineStatus Status { get; set; } = DeadlineStatus.OnTrack;
}

public enum DeadlineStatus
{
    OnTrack,
    Behind,
    Completed
}
