using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Schedule;

/// <summary>
/// Update schedule block definition request - all fields optional for partial updates
/// </summary>
public class UpdateScheduleBlockDefinitionRequest
{
    /// <summary>
    /// Block title (optional)
    /// </summary>
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string? Title { get; set; }

    /// <summary>
    /// Block kind (optional). Valid values: fixed, flexible, recurring, routine
    /// </summary>
    [RegularExpression("^(fixed|flexible|recurring|routine)$", ErrorMessage = "Kind must be one of: fixed, flexible, recurring, routine")]
    public string? Kind { get; set; }

    /// <summary>
    /// Recurrence pattern (optional). Valid values: none, daily, weekly
    /// </summary>
    [RegularExpression("^(none|daily|weekly)$", ErrorMessage = "Recurrence must be one of: none, daily, weekly")]
    public string? Recurrence { get; set; }

    /// <summary>
    /// Days of week (0=Sunday, 6=Saturday) (optional)
    /// </summary>
    public int[]? DaysOfWeek { get; set; }

    /// <summary>
    /// Minimum occurrences per week (optional)
    /// </summary>
    [Range(0, 7, ErrorMessage = "MinPerWeek must be between 0 and 7")]
    public int? MinPerWeek { get; set; }

    /// <summary>
    /// Maximum occurrences per week (optional)
    /// </summary>
    [Range(1, 7, ErrorMessage = "MaxPerWeek must be between 1 and 7")]
    public int? MaxPerWeek { get; set; }

    /// <summary>
    /// Fixed start time (optional). Format: HH:mm (24-hour format)
    /// </summary>
    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "FixedStartTime must be in HH:mm format (24-hour)")]
    public string? FixedStartTime { get; set; }

    /// <summary>
    /// Fixed end time (optional). Format: HH:mm (24-hour format)
    /// </summary>
    [RegularExpression(@"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "FixedEndTime must be in HH:mm format (24-hour)")]
    public string? FixedEndTime { get; set; }

    /// <summary>
    /// Preferred time of day (optional). Valid values: morning, afternoon, evening
    /// </summary>
    [RegularExpression("^(morning|afternoon|evening)$", ErrorMessage = "PreferredTimeTag must be one of: morning, afternoon, evening")]
    public string? PreferredTimeTag { get; set; }

    /// <summary>
    /// Duration in minutes (optional)
    /// </summary>
    [Range(1, 1440, ErrorMessage = "DurationMinutes must be between 1 and 1440 (24 hours)")]
    public int? DurationMinutes { get; set; }

    /// <summary>
    /// Energy level (optional). Valid values: low, medium, high
    /// </summary>
    [RegularExpression("^(low|medium|high)$", ErrorMessage = "Energy must be one of: low, medium, high")]
    public string? Energy { get; set; }

    /// <summary>
    /// Tags for categorizing blocks (optional)
    /// </summary>
    public string[]? Tags { get; set; }

    /// <summary>
    /// Whether the block is enabled (optional)
    /// </summary>
    public bool? Enabled { get; set; }

    /// <summary>
    /// Priority for scheduling (optional)
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "Priority must be a non-negative number")]
    public int? Priority { get; set; }

    /// <summary>
    /// Routine activities list (optional)
    /// </summary>
    public List<string>? RoutineActivities { get; set; }
}
