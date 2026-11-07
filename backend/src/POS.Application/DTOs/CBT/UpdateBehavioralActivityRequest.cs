namespace POS.Application.DTOs.CBT;

/// <summary>
/// Update behavioral activity request
/// </summary>
public class UpdateBehavioralActivityRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public string? Notes { get; set; }
    public string? Lifecycle { get; set; }
    public string? FirstStep { get; set; }
    public string? LinkedTaskId { get; set; }
}
