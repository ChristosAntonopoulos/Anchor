namespace POS.Application.DTOs.Night;

public class NightTomorrowPlanDto
{
    public string? TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string FirstPhysicalAction { get; set; } = string.Empty;
    public List<string> NextMicroActions { get; set; } = [];
    public string EasierAlternative { get; set; } = string.Empty;
}

public class NightHelpRequest
{
    public string Step { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}

public class NightHelpDto
{
    public string Text { get; set; } = string.Empty;
}
