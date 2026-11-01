using POS.Application.DTOs;

namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Task DTO with all optional features
/// </summary>
public class TaskDto : ResponseDto
{
    // Core fields
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability
    public bool Completed { get; set; }
    public DateTime Date { get; set; }
    public string Source { get; set; } = "user"; // ai|user|notification

    // Optional fields
    public string? Notes { get; set; }
    public string? PrivateNotes { get; set; }
    public List<SubtaskDto>? Subtasks { get; set; }
    public LocationDto? Location { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Priority { get; set; } // low|medium|high|urgent
    public RecurrencePatternDto? Recurrence { get; set; }
    public List<string>? Tags { get; set; }
    public int? EstimatedMinutes { get; set; }
    public List<ReminderDto>? Reminders { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? Order { get; set; }

    public string Status { get; set; } = POS.Core.Constants.TaskStatus.Inbox;
    public int? FocusRank { get; set; }
    public DateTime? PlannedDate { get; set; }
    public DateTime? SnoozedUntil { get; set; }
    public string? AiInputId { get; set; }
}
