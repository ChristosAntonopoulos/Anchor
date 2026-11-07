namespace POS.Application.DTOs.Schedule;

public class ScheduleChecklistItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public bool Completed { get; set; }
    public int Order { get; set; }
}
