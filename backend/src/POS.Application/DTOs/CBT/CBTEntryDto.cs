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
}
