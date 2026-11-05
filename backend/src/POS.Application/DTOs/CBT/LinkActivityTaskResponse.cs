namespace POS.Application.DTOs.CBT;

public class LinkActivityTaskResponse
{
    public BehavioralActivityDto Activity { get; set; } = new();
    public string TaskId { get; set; } = string.Empty;
    public bool AlreadyLinked { get; set; }
}
