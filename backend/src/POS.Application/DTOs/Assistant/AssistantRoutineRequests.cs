using System.ComponentModel.DataAnnotations;
using POS.Application.DTOs.Routine;

namespace POS.Application.DTOs.Assistant;

public class AssistantRoutineUpsertRequest
{
    [StringLength(200)]
    public string? Title { get; set; }

    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string? StartTime { get; set; }

    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string? EndTime { get; set; }

    [Range(0, 23)]
    public int? TriggerHour { get; set; }

    [Range(0, 59)]
    public int? TriggerMinute { get; set; }

    public List<RoutineStepDto>? Steps { get; set; }

    public List<RoutineStepDto>? ShorterSteps { get; set; }
}

public class AssistantReplaceStepsRequest
{
    [Required]
    [MinLength(1)]
    public List<RoutineStepDto> Steps { get; set; } = [];

    /// <summary>When true, replaces hard-day / shorter variant steps.</summary>
    public bool Shorter { get; set; }
}

public class AssistantReorderStepsRequest
{
    [Required]
    [MinLength(1)]
    public List<string> StepIds { get; set; } = [];

    public bool Shorter { get; set; }
}

public class AssistantModeSettingsRequest
{
    [Range(0, 23)]
    public int? TriggerHour { get; set; }

    [Range(0, 59)]
    public int? TriggerMinute { get; set; }

    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string? StartTime { get; set; }

    [RegularExpression(@"^([01]?\d|2[0-3]):[0-5]\d$")]
    public string? EndTime { get; set; }
}
