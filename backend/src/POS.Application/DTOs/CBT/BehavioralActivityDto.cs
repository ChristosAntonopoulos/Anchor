namespace POS.Application.DTOs.CBT;

/// <summary>
/// Behavioral Activity DTO
/// </summary>
public class BehavioralActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public int? MoodBefore { get; set; }
    public int? MoodAfter { get; set; }
    public int? PleasureRating { get; set; }
    public int? MasteryRating { get; set; }
    public string? Notes { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
