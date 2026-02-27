using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.CBT;

/// <summary>
/// Create CBT entry request
/// </summary>
public class CreateCBTEntryRequest
{
    /// <summary>
    /// CBT entry text content (required)
    /// </summary>
    [Required(ErrorMessage = "Text is required")]
    [StringLength(5000, ErrorMessage = "Text cannot exceed 5000 characters")]
    public string Text { get; set; } = string.Empty;
}
