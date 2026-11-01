namespace POS.Application.DTOs.CBT;

/// <summary>
/// Update CBT entry request (for manual edits)
/// </summary>
public class UpdateCBTEntryRequest
{
    public string? Text { get; set; }
    public string? Title { get; set; }
    public string? RecordState { get; set; }
    public string? SupportType { get; set; }
    public string? Energy { get; set; }
    public List<FeelingRatingDto>? Feelings { get; set; }
    public string? Situation { get; set; }
    public List<AutomaticThoughtDto>? AutomaticThoughts { get; set; }
    public List<string>? EvidenceFor { get; set; }
    public List<string>? EvidenceAgainst { get; set; }
    public List<string>? AlternativeThoughts { get; set; }
    public string? Outcome { get; set; }
    public string? ThoughtState { get; set; }
    public int? BeliefBefore { get; set; }
    public int? BeliefAfter { get; set; }
    public ProblemSolvingRecordDto? ProblemSolving { get; set; }
    public string? LinkedUnlockEventId { get; set; }
}
