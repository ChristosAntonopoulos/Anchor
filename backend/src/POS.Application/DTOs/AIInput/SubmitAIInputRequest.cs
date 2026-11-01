using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.AIInput;

/// <summary>
/// Request to submit natural language input for AI processing
/// </summary>
public class SubmitAIInputRequest
{
    /// <summary>
    /// Natural language text input to be processed by AI (required)
    /// </summary>
    [Required(ErrorMessage = "Text is required")]
    [StringLength(10000, ErrorMessage = "Text cannot exceed 10000 characters")]
    public string Text { get; set; } = string.Empty;
}
