using POS.Application.DTOs;

namespace POS.Application.DTOs.Discipline;

/// <summary>
/// Discipline entry DTO
/// </summary>
public class DisciplineEntryDto : ResponseDto
{
    public List<DisciplineBlockDto> Blocks { get; set; } = new();
    public string? Note { get; set; }
    public DateTime Date { get; set; }
}
