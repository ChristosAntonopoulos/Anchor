using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Tasks;

/// <summary>
/// Reminder - notification reminder for a task
/// </summary>
public class Reminder
{
    [BsonElement("reminderTime")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime ReminderTime { get; set; }

    [BsonElement("type")]
    public string Type { get; set; } = "notification"; // notification|alarm

    [BsonElement("triggered")]
    public bool Triggered { get; set; }
}
