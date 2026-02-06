using POS.Application.DTOs;

namespace POS.Application.DTOs.WeeklyReview;

/// <summary>
/// Weekly review DTO
/// </summary>
public class WeeklyReviewDto : ResponseDto
{
    public string WeekId { get; set; } = string.Empty; // YYYY-WW format
    public string AiSummary { get; set; } = string.Empty;
    public string? Shipped { get; set; }
    public string? Improved { get; set; }
    public string? Avoided { get; set; }
    public string? NextFocus { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
}
