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
}
