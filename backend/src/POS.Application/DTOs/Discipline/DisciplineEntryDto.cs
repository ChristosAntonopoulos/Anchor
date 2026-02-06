using POS.Application.DTOs;

namespace POS.Application.DTOs.Discipline;

/// <summary>
/// Discipline entry DTO
/// </summary>
public class DisciplineEntryDto : ResponseDto
{
    public bool Gym { get; set; }
    public bool Walk { get; set; }
    public bool Cooked { get; set; }
    public bool Diet { get; set; }
    public bool Meditation { get; set; }
    public bool Water { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
}
