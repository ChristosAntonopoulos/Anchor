using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Discipline;

/// <summary>
/// Create discipline entry request
/// </summary>
public class CreateDisciplineRequest
{
    /// <summary>
    /// Date of discipline entry (required). Format: YYYY-MM-DD
    /// </summary>
    [Required(ErrorMessage = "Date is required")]
    [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be in YYYY-MM-DD format")]
    public string Date { get; set; } = string.Empty;

    /// <summary>
    /// Discipline blocks (optional, defaults to default blocks if not provided)
    /// </summary>
    public List<DisciplineBlockDto>? Blocks { get; set; }

    /// <summary>
    /// Additional notes (optional)
    /// </summary>
    [StringLength(1000, ErrorMessage = "Note cannot exceed 1000 characters")]
    public string? Note { get; set; }
}
