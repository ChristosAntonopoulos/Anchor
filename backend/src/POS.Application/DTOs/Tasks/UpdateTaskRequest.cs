namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Update task request - all fields optional for partial updates
/// </summary>
public class UpdateTaskRequest
{
    public string? Title { get; set; }
    public string? Category { get; set; } // work|leverage|health|stability
    public bool? Completed { get; set; }
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
