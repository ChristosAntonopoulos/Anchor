namespace POS.Application.DTOs.Morning;

public class MorningFirstTaskDto
{
    public string? TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string FirstPhysicalAction { get; set; } = string.Empty;
    public List<string> NextMicroActions { get; set; } = [];
    public string EasierAlternative { get; set; } = string.Empty;
}

public class MorningHelpRequest
{
    public string Step { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}

public class MorningHelpDto
{
    public string Text { get; set; } = string.Empty;
}
