namespace POS.Application.DTOs.CBT;

public class CheckInAssistResponse
{
    public string? Reflection { get; set; }
    public List<string>? SuggestedEmotionCodes { get; set; }
    public CheckInAssistQuestion? Question { get; set; }
    public List<CheckInSuggestedAction>? SuggestedActions { get; set; }
    public bool UsedAi { get; set; }
}

public class CheckInAssistQuestion
{
    public string Text { get; set; } = string.Empty;
    public string TargetField { get; set; } = string.Empty;
}

public class CheckInSuggestedAction
{
    public string TemplateId { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public string? ProposedFirstStep { get; set; }
}
