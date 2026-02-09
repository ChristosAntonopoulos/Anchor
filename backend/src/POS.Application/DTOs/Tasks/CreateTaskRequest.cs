namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Create task request with optional features
/// </summary>
public class CreateTaskRequest
{
    // Required fields
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability

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
    public int? Order { get; set; }
}
