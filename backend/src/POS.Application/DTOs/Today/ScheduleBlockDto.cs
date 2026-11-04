using POS.Application.DTOs.Schedule;

namespace POS.Application.DTOs.Today;

/// <summary>
/// Schedule block DTO for Today response
/// </summary>
public class ScheduleBlockDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty; // HH:mm format
    public string EndTime { get; set; } = string.Empty; // HH:mm format
    public List<string>? RoutineActivities { get; set; }
    public List<ScheduleChecklistItemDto>? ChecklistItems { get; set; }
    public string? TaskId { get; set; }
    public string? EntryAction { get; set; }
    public int? StartMinutes { get; set; }
    public string? RoutineVersion { get; set; }
}
