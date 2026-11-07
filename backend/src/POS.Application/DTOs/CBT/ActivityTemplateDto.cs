namespace POS.Application.DTOs.CBT;

public class ActivityTemplateDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string FirstStep { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string Effort { get; set; } = "low";
    public string Purpose { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string SmallerVersion { get; set; } = string.Empty;
    public string Category { get; set; } = "coping_skill";
    public string Source { get; set; } = "reviewed-catalog";
    public string ContentVersion { get; set; } = "1";
    public bool IsBreathing { get; set; }
}
