namespace POS.Application.DTOs.Discipline;

/// <summary>
/// Create discipline entry request
/// </summary>
public class CreateDisciplineRequest
{
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD format
    public List<DisciplineBlockDto>? Blocks { get; set; } // Optional, defaults to default blocks if not provided
    public string? Note { get; set; }
}
