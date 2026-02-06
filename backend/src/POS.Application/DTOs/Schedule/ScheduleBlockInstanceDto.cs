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
}
