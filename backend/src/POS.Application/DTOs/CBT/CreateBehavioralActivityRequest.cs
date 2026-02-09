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
}
