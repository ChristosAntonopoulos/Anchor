using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Update task request - all fields optional for partial updates
/// </summary>
public class UpdateTaskRequest
{
    /// <summary>
    /// Task title (optional)
    /// </summary>
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string? Title { get; set; }

    /// <summary>
    /// Task category (optional). Valid values: work, leverage, health, stability
    /// </summary>
    [RegularExpression("^(work|leverage|health|stability)$", ErrorMessage = "Category must be one of: work, leverage, health, stability")]
    public string? Category { get; set; }

    /// <summary>
    /// Whether task is completed (optional)
    /// </summary>
    public bool? Completed { get; set; }

    /// <summary>
    /// Additional notes (optional)
    /// </summary>
    [StringLength(2000, ErrorMessage = "Notes cannot exceed 2000 characters")]
    public string? Notes { get; set; }

    /// <summary>
    /// Private notes (optional)
    /// </summary>
    [StringLength(2000, ErrorMessage = "Private notes cannot exceed 2000 characters")]
    public string? PrivateNotes { get; set; }

    /// <summary>
    /// List of subtasks (optional)
    /// </summary>
    public List<SubtaskDto>? Subtasks { get; set; }

    /// <summary>
    /// Location associated with the task (optional)
    /// </summary>
    public LocationDto? Location { get; set; }

    /// <summary>
    /// Due date and time (optional)
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Task priority (optional). Valid values: low, medium, high, urgent
    /// </summary>
    [RegularExpression("^(low|medium|high|urgent)$", ErrorMessage = "Priority must be one of: low, medium, high, urgent")]
    public string? Priority { get; set; }

    /// <summary>
    /// Recurrence pattern (optional)
    /// </summary>
    public RecurrencePatternDto? Recurrence { get; set; }

    /// <summary>
    /// Tags for categorizing tasks (optional)
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Estimated time to complete in minutes (optional)
    /// </summary>
    [Range(1, 10080, ErrorMessage = "Estimated minutes must be between 1 and 10080 (1 week)")]
    public int? EstimatedMinutes { get; set; }

    /// <summary>
    /// Reminders for the task (optional)
    /// </summary>
    public List<ReminderDto>? Reminders { get; set; }

    /// <summary>
    /// Display order for sorting (optional)
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "Order must be a non-negative number")]
    public int? Order { get; set; }
}
