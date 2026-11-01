namespace POS.Application.DTOs.Day;

public class DayBootstrapDto
{
    public string Status { get; set; } = "pending";
    public bool AssessmentSeen { get; set; }
    public string? Error { get; set; }
    public YesterdayAssessmentDto? YesterdayAssessment { get; set; }
}

public class YesterdayAssessmentDto
{
    public string Summary { get; set; } = string.Empty;
    public List<string> Wins { get; set; } = new();
    public List<string> Misses { get; set; } = new();
    public List<string> CarryForward { get; set; } = new();
    public string? MoodNote { get; set; }
    public DateTime? GeneratedAt { get; set; }
}
