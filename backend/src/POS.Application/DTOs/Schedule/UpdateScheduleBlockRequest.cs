namespace POS.Application.DTOs.Schedule;

/// <summary>
/// Update schedule block request DTO
/// </summary>
public class UpdateScheduleBlockRequest
{
    public string Id { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? StartTime { get; set; } // HH:mm format
    public string? EndTime { get; set; } // HH:mm format
}
