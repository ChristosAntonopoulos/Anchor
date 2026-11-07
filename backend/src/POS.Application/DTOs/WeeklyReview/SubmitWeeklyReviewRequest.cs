using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.WeeklyReview;

/// <summary>
/// Submit weekly review request
/// </summary>
public class SubmitWeeklyReviewRequest
{
    /// <summary>
    /// What was shipped/completed this week (required)
    /// </summary>
    [Required(ErrorMessage = "Shipped is required")]
    [StringLength(5000, ErrorMessage = "Shipped cannot exceed 5000 characters")]
    public string Shipped { get; set; } = string.Empty;

    /// <summary>
    /// What was improved this week (required)
    /// </summary>
    [Required(ErrorMessage = "Improved is required")]
    [StringLength(5000, ErrorMessage = "Improved cannot exceed 5000 characters")]
    public string Improved { get; set; } = string.Empty;

    /// <summary>
    /// What was avoided this week (required)
    /// </summary>
    [Required(ErrorMessage = "Avoided is required")]
    [StringLength(5000, ErrorMessage = "Avoided cannot exceed 5000 characters")]
    public string Avoided { get; set; } = string.Empty;

    /// <summary>
    /// Focus for next week (required)
    /// </summary>
    [Required(ErrorMessage = "NextFocus is required")]
    [StringLength(5000, ErrorMessage = "NextFocus cannot exceed 5000 characters")]
    public string NextFocus { get; set; } = string.Empty;
}
