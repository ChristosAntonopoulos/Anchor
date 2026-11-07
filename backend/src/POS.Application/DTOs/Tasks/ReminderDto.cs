namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Reminder DTO
/// </summary>
public class ReminderDto
{
    public DateTime ReminderTime { get; set; }
    public string Type { get; set; } = "notification"; // notification|alarm
    public bool Triggered { get; set; }
}
