namespace POS.Application.DTOs.CBT;

/// <summary>
/// CBT Entry DTO
/// </summary>
public class CBTEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string? Mood { get; set; }
    public int? MoodIntensity { get; set; }
    public string? Situation { get; set; }
    public List<AutomaticThoughtDto>? AutomaticThoughts { get; set; }
    public List<string>? CognitiveDistortions { get; set; }
    public List<string>? EvidenceFor { get; set; }
    public List<string>? EvidenceAgainst { get; set; }
    public List<string>? AlternativeThoughts { get; set; }
    public List<string>? Behaviors { get; set; }
    public string? Outcome { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime? ProcessedAt { get; set; }
    public string? AIInsights { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int SchemaVersion { get; set; } = 1;
    public string? Title { get; set; }
    public string RecordState { get; set; } = "saved";
    public string? SupportType { get; set; }
    public DateTime? OccurredAtUtc { get; set; }
    public string? Timezone { get; set; }
    public int? UtcOffsetMinutes { get; set; }
    public string? Energy { get; set; }
    public string? Tiredness { get; set; }
    public string? Numbness { get; set; }
    public List<FeelingRatingDto>? Feelings { get; set; }
    public string? ThoughtState { get; set; }
    public int? BeliefBefore { get; set; }
    public int? BeliefAfter { get; set; }
    public ProblemSolvingRecordDto? ProblemSolving { get; set; }
    public string? LinkedUnlockEventId { get; set; }
}
