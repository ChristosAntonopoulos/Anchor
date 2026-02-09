namespace POS.Application.DTOs.CBT;

/// <summary>
/// Update CBT entry request (for manual edits)
/// </summary>
public class UpdateCBTEntryRequest
{
    public string? Situation { get; set; }
    public List<AutomaticThoughtDto>? AutomaticThoughts { get; set; }
    public List<string>? EvidenceFor { get; set; }
    public List<string>? EvidenceAgainst { get; set; }
    public List<string>? AlternativeThoughts { get; set; }
    public string? Outcome { get; set; }
}
