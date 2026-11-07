using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.CBT;

/// <summary>
/// Create CBT entry request
/// </summary>
public class CreateCBTEntryRequest
{
    /// <summary>
    /// CBT entry text content (required)
    /// </summary>
    [StringLength(5000, ErrorMessage = "Text cannot exceed 5000 characters")]
    public string? Text { get; set; }

    public string? Title { get; set; }
    public string? RecordState { get; set; }
    public string? SupportType { get; set; }
    public DateTime? OccurredAtUtc { get; set; }
    public string? Timezone { get; set; }
    public int? UtcOffsetMinutes { get; set; }
    public string? Energy { get; set; }
    public List<FeelingRatingDto>? Feelings { get; set; }
    public string? LinkedUnlockEventId { get; set; }
}
