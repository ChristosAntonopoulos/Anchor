using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.CBT;

/// <summary>
/// Behavioral Activity - Behavioral activation activities
/// </summary>
[BsonIgnoreExtraElements]
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

    [BsonElement("schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [BsonElement("checkInId")]
    public string? CheckInId { get; set; }

    [BsonElement("templateId")]
    public string? TemplateId { get; set; }

    [BsonElement("templateVersion")]
    public string? TemplateVersion { get; set; }

    [BsonElement("lifecycle")]
    public string? Lifecycle { get; set; }

    [BsonElement("firstStep")]
    public string? FirstStep { get; set; }

    [BsonElement("category")]
    public string? Category { get; set; }

    [BsonElement("effort")]
    public string? Effort { get; set; }

    [BsonElement("durationMinutes")]
    public int? DurationMinutes { get; set; }

    [BsonElement("completionExtent")]
    public string? CompletionExtent { get; set; }

    [BsonElement("usefulness")]
    public string? Usefulness { get; set; }

    [BsonElement("enjoyment")]
    public string? Enjoyment { get; set; }

    [BsonElement("accomplishment")]
    public string? Accomplishment { get; set; }

    [BsonElement("changeNextTime")]
    public string? ChangeNextTime { get; set; }

    [BsonElement("linkedTaskId")]
    public string? LinkedTaskId { get; set; }
}
