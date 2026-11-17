using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Assistant;

public class AssistantScheduleBlockUpsertRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    /// <summary>fixed | flexible | recurring | routine</summary>
    [RegularExpression("^(fixed|flexible|recurring|routine)$")]
    public string? Kind { get; set; }

    /// <summary>none | daily | weekly</summary>
    [RegularExpression("^(none|daily|weekly)$")]
    public string? Recurrence { get; set; }

    /// <summary>0=Sun … 6=Sat</summary>
    public int[]? DaysOfWeek { get; set; }

    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string? FixedStartTime { get; set; }

    /// <summary>May be earlier than start when the block crosses midnight.</summary>
    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string? FixedEndTime { get; set; }

    [Range(1, 1440)]
    public int? DurationMinutes { get; set; }

    [RegularExpression("^(morning|afternoon|evening)$")]
    public string? PreferredTimeTag { get; set; }

    [RegularExpression("^(low|medium|high)$")]
    public string? Energy { get; set; }

    public string[]? Tags { get; set; }

    public bool? Enabled { get; set; }

    [Range(0, int.MaxValue)]
    public int? Priority { get; set; }

    public List<string>? RoutineActivities { get; set; }

    public List<string>? ShorterRoutineActivities { get; set; }
}

public class AssistantDayBlockOverrideRequest
{
    [Required]
    [RegularExpression(@"^\d{4}-\d{2}-\d{2}$")]
    public string Date { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string StartTime { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string EndTime { get; set; } = string.Empty;

    public string? DefinitionId { get; set; }

    public List<string>? RoutineActivities { get; set; }

    public bool? Locked { get; set; }
}

public class AssistantUpdateDayBlockRequest
{
    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string? StartTime { get; set; }

    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string? EndTime { get; set; }

    [StringLength(200)]
    public string? Title { get; set; }

    public List<string>? RoutineActivities { get; set; }

    public bool? Locked { get; set; }
}
