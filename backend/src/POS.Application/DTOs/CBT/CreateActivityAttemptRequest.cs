namespace POS.Application.DTOs.CBT;

public class CreateActivityAttemptRequest
{
    public string? CompletionExtent { get; set; }
    public string? Usefulness { get; set; }
    public string? Enjoyment { get; set; }
    public string? Accomplishment { get; set; }
    public string? ChangeNextTime { get; set; }
    public string? Notes { get; set; }
    public int? DurationMinutes { get; set; }
    public DateTime? AttemptedAtUtc { get; set; }
    public List<FeelingRatingDto>? FeelingAfter { get; set; }
}
