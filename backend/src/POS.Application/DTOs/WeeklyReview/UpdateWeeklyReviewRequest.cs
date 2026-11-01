namespace POS.Application.DTOs.WeeklyReview;

/// <summary>
/// Update weekly review request
/// </summary>
public class UpdateWeeklyReviewRequest
{
    public string? AiSummary { get; set; }
    public string? Shipped { get; set; }
    public string? Improved { get; set; }
    public string? Avoided { get; set; }
    public string? NextFocus { get; set; }
    public bool? Completed { get; set; }
}
