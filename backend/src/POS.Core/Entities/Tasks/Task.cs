using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Tasks;

/// <summary>
/// Task - daily execution tasks with optional enhanced features
/// </summary>
public class Task : DayAnchoredEntity
{
    // Core fields (existing)
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability

    [BsonElement("completed")]
    public bool Completed { get; set; }

    [BsonElement("source")]
    public string Source { get; set; } = "user"; // ai|user|notification

    // New optional fields
    [BsonElement("notes")]
    public string? Notes { get; set; } // Public notes

    [BsonElement("privateNotes")]
    public string? PrivateNotes { get; set; } // Hidden notes (only visible when editing)

    [BsonElement("subtasks")]
    public List<Subtask>? Subtasks { get; set; } // Hidden to-do list / checklist

    [BsonElement("location")]
    public Location? Location { get; set; } // GPS coordinates + address

    [BsonElement("dueDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? DueDate { get; set; } // Optional due date/time

    [BsonElement("priority")]
    public string? Priority { get; set; } // low|medium|high|urgent

    [BsonElement("recurrence")]
    public RecurrencePattern? Recurrence { get; set; } // Recurring task pattern

    [BsonElement("tags")]
    public List<string>? Tags { get; set; } // Flexible tagging

    [BsonElement("estimatedMinutes")]
    public int? EstimatedMinutes { get; set; } // Time estimation

    [BsonElement("reminders")]
    public List<Reminder>? Reminders { get; set; } // Notification reminders

    [BsonElement("completedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? CompletedAt { get; set; } // Completion timestamp

    [BsonElement("order")]
    public int? Order { get; set; } // Manual ordering

    /// <summary>
    /// Lifecycle: inbox | today | done | archived | snoozed
    /// </summary>
    [BsonElement("status")]
    public string? Status { get; set; }

    /// <summary>
    /// Rank on today's focus list (1 = highest). Only meaningful when status is today.
    /// </summary>
    [BsonElement("focusRank")]
    public int? FocusRank { get; set; }

    /// <summary>
    /// Day the user committed to work on this task (UTC date).
    /// </summary>
    [BsonElement("plannedDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc, DateOnly = true)]
    public DateTime? PlannedDate { get; set; }

    [BsonElement("snoozedUntil")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? SnoozedUntil { get; set; }

    [BsonElement("aiInputId")]
    public string? AiInputId { get; set; }
}
