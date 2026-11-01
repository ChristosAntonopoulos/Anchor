using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Deadlines;

/// <summary>
/// Create deadline request
/// </summary>
public class CreateDeadlineRequest
{
    /// <summary>
    /// Deadline title (required)
    /// </summary>
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Due date (required). Format: YYYY-MM-DD
    /// </summary>
    [Required(ErrorMessage = "DueDate is required")]
    [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "DueDate must be in YYYY-MM-DD format")]
    public string DueDate { get; set; } = string.Empty;

    /// <summary>
    /// Importance level (optional, defaults to 3). Range: 1-5 (1 = low, 5 = critical)
    /// </summary>
    [Range(1, 5, ErrorMessage = "Importance must be between 1 and 5")]
    public int Importance { get; set; } = 3;
}
