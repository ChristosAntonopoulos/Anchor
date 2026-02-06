namespace POS.Application.DTOs.WeeklyReview;

/// <summary>
/// Submit weekly review request
/// </summary>
public class SubmitWeeklyReviewRequest
{
    public string Shipped { get; set; } = string.Empty;
    public string Improved { get; set; } = string.Empty;
    public string Avoided { get; set; } = string.Empty;
    public string NextFocus { get; set; } = string.Empty;
}
