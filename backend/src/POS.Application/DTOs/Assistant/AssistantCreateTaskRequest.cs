using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Assistant;

/// <summary>
/// Create a task or inbox item from an external assistant.
/// </summary>
public class AssistantCreateTaskRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// work | leverage | health | stability (default: work)
    /// </summary>
    [RegularExpression("^(work|leverage|health|stability)$")]
    public string? Category { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }

    /// <summary>
    /// inbox (default) or today
    /// </summary>
    [RegularExpression("^(inbox|today)$")]
    public string? Status { get; set; }

    [RegularExpression("^(low|medium|high|urgent)$")]
    public string? Priority { get; set; }
}
