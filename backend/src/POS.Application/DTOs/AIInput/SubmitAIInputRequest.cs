namespace POS.Application.DTOs.AIInput;

/// <summary>
/// Request to submit natural language input for AI processing
/// </summary>
public class SubmitAIInputRequest
{
    public string Text { get; set; } = string.Empty;
}
