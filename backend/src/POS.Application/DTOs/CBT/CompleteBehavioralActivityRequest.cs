namespace POS.Application.DTOs.CBT;

/// <summary>
/// Complete behavioral activity request
/// </summary>
public class CompleteBehavioralActivityRequest
{
    public int? MoodBefore { get; set; }
    public int? MoodAfter { get; set; }
    public int? PleasureRating { get; set; }
    public int? MasteryRating { get; set; }
    public string? Notes { get; set; }
}
