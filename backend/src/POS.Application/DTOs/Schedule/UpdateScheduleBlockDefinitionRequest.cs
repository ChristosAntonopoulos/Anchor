namespace POS.Application.DTOs.Schedule;

/// <summary>
/// Update schedule block definition request
/// </summary>
public class UpdateScheduleBlockDefinitionRequest
{
    public string? Title { get; set; }
    public string? Kind { get; set; } // fixed|flexible|recurring|routine
    public string? Recurrence { get; set; } // none|daily|weekly
    public int[]? DaysOfWeek { get; set; }
    public int? MinPerWeek { get; set; }
    public int? MaxPerWeek { get; set; }
    public string? FixedStartTime { get; set; } // HH:mm format
    public string? FixedEndTime { get; set; } // HH:mm format
    public string? PreferredTimeTag { get; set; } // morning|afternoon|evening
    public int? DurationMinutes { get; set; }
    public string? Energy { get; set; } // low|medium|high
    public string[]? Tags { get; set; }
    public bool? Enabled { get; set; }
    public int? Priority { get; set; }
    public List<string>? RoutineActivities { get; set; }
}
