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
    public int SchemaVersion { get; set; } = 1;
    public string? CheckInId { get; set; }
    public string? TemplateId { get; set; }
    public string? TemplateVersion { get; set; }
    public string? Lifecycle { get; set; }
    public string? FirstStep { get; set; }
    public string? Category { get; set; }
    public string? Effort { get; set; }
    public int? DurationMinutes { get; set; }
    public string? CompletionExtent { get; set; }
    public string? Usefulness { get; set; }
    public string? Enjoyment { get; set; }
    public string? Accomplishment { get; set; }
    public string? ChangeNextTime { get; set; }
    public string? LinkedTaskId { get; set; }
}
