namespace POS.Application.DTOs.CBT;

/// <summary>
/// Create behavioral activity request
/// </summary>
public class CreateBehavioralActivityRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public string? Notes { get; set; }
    public string? CheckInId { get; set; }
    public string? TemplateId { get; set; }
    public string? TemplateVersion { get; set; }
    public string? Lifecycle { get; set; }
    public string? FirstStep { get; set; }
    public string? Category { get; set; }
    public string? Effort { get; set; }
    public int? DurationMinutes { get; set; }
}
