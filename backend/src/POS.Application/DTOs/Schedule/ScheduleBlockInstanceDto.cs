using POS.Application.DTOs;

namespace POS.Application.DTOs.Schedule;

/// <summary>
/// Schedule block instance DTO
/// </summary>
public class ScheduleBlockInstanceDto : ResponseDto
{
    public string DefinitionId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty; // HH:mm format
    public string EndTime { get; set; } = string.Empty; // HH:mm format
    public bool Locked { get; set; }
    public string Source { get; set; } = string.Empty; // ai|user
    public DateTime Date { get; set; }
    public List<string>? RoutineActivities { get; set; } // Activities for this routine instance
    public List<ScheduleChecklistItemDto>? ChecklistItems { get; set; }
    public string? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public string? EntryAction { get; set; }
    public int? StartMinutes { get; set; }
    public string WindowKind { get; set; } = "exact";
    public string? ManualCue { get; set; }
    public string RoutineVersion { get; set; } = "regular";
    public bool Skipped { get; set; }
    public List<string>? ShorterRoutineActivities { get; set; }
    public bool IsRoutine { get; set; }
}
