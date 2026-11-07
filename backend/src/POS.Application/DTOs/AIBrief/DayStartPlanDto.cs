namespace POS.Application.DTOs.AIBrief;

public class DayStartPlanDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? FocusCategory { get; set; }
    public bool Applied { get; set; }
    public YesterdayAssessmentDto? YesterdayAssessment { get; set; }
    public List<string> TodayFocusTasks { get; set; } = new();
}

public class YesterdayAssessmentDto
{
    public string? Summary { get; set; }
    public List<string> Wins { get; set; } = new();
    public List<string> Misses { get; set; } = new();
    public List<string> CarryForward { get; set; } = new();
    public string? MoodNote { get; set; }
    public string? DietNote { get; set; }
    public DateTime? GeneratedAt { get; set; }
}
