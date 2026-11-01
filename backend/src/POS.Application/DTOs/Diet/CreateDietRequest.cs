using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Diet;

/// <summary>
/// Create diet entry request
/// </summary>
public class CreateDietRequest
{
    /// <summary>
    /// Date of diet entry (required). Format: YYYY-MM-DD
    /// </summary>
    [Required(ErrorMessage = "Date is required")]
    [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be in YYYY-MM-DD format")]
    public string Date { get; set; } = string.Empty;

    /// <summary>
    /// Whether diet was compliant (optional)
    /// </summary>
    public bool? Compliant { get; set; }

    /// <summary>
    /// URI to photo of meal (optional)
    /// </summary>
    [StringLength(500, ErrorMessage = "PhotoUri cannot exceed 500 characters")]
    public string? PhotoUri { get; set; }

    /// <summary>
    /// Additional notes (optional)
    /// </summary>
    [StringLength(1000, ErrorMessage = "Note cannot exceed 1000 characters")]
    public string? Note { get; set; }
}
