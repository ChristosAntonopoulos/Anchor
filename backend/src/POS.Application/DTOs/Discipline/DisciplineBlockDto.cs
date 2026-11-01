namespace POS.Application.DTOs.Discipline;

/// <summary>
/// Discipline block DTO
/// </summary>
public class DisciplineBlockDto
{
    public string BlockId { get; set; } = string.Empty;
    public string BlockName { get; set; } = string.Empty;
    public List<DisciplineItemDto> Items { get; set; } = new();
    public int Order { get; set; }
}
