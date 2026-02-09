using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.CBT;

/// <summary>
/// Behavioral Activity - Behavioral activation activities
/// </summary>
public class BehavioralActivity : EntityBase
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty; // Activity name

    [BsonElement("description")]
    public string? Description { get; set; } // Activity description

    [BsonElement("scheduledDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ScheduledDate { get; set; } // When scheduled

    [BsonElement("completedDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? CompletedDate { get; set; } // When completed

    [BsonElement("moodBefore")]
    public int? MoodBefore { get; set; } // Mood rating before (0-10)

    [BsonElement("moodAfter")]
    public int? MoodAfter { get; set; } // Mood rating after (0-10)

    [BsonElement("pleasureRating")]
    public int? PleasureRating { get; set; } // Pleasure rating (0-10)

    [BsonElement("masteryRating")]
    public int? MasteryRating { get; set; } // Mastery/sense of accomplishment (0-10)

    [BsonElement("notes")]
    public string? Notes { get; set; } // User notes

    [BsonElement("isCompleted")]
    public bool IsCompleted { get; set; } = false;
}
