using POS.Application.DTOs;

namespace POS.Application.DTOs.Schedule;

/// <summary>
/// Schedule block definition DTO
/// </summary>
public class ScheduleBlockDefinitionDto : ResponseDto
{
    public string Title { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty; // fixed|flexible|recurring
    public string Recurrence { get; set; } = string.Empty; // none|daily|weekly
    public int[]? DaysOfWeek { get; set; }
    public int? MinPerWeek { get; set; }
    public int? MaxPerWeek { get; set; }
    public string? FixedStartTime { get; set; } // HH:mm format
    public string? FixedEndTime { get; set; } // HH:mm format
    public string? PreferredTimeTag { get; set; } // morning|afternoon|evening
    public int? DurationMinutes { get; set; }
    public string Energy { get; set; } = string.Empty; // low|medium|high
    public string[] Tags { get; set; } = Array.Empty<string>();
    public bool Enabled { get; set; } = true;
    public int Priority { get; set; } = 3;
}
