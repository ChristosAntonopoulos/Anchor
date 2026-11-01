namespace POS.Application.DTOs.CBT;

public class CheckInAssistRequest
{
    public string? SupportType { get; set; }
    public List<string>? DismissedTemplateIds { get; set; }
    public List<string>? ExcludedTemplateIds { get; set; }
    public bool UsePreviousEntries { get; set; }
    public string? RequestedCategory { get; set; }
}
