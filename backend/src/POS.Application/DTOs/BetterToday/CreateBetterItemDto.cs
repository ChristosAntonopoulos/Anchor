using System.ComponentModel.DataAnnotations;
using POS.Application.DTOs;

namespace POS.Application.DTOs.BetterToday;

/// <summary>
/// Create better item DTO
/// </summary>
public class CreateBetterItemDto : CreateDto
{
    /// <summary>
    /// Better item title (required)
    /// </summary>
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Category (required). Valid values: work, leverage, health, stability
    /// </summary>
    [Required(ErrorMessage = "Category is required")]
    [RegularExpression("^(work|leverage|health|stability)$", ErrorMessage = "Category must be one of: work, leverage, health, stability")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Date for the better item (optional, defaults to today if not provided)
    /// </summary>
    public DateTime? Date { get; set; }

    /// <summary>
    /// Source of the item (optional, defaults to "user" if not provided). Use "ai" for AI-generated items
    /// </summary>
    [StringLength(50, ErrorMessage = "Source cannot exceed 50 characters")]
    public string? Source { get; set; }
}
