using System.ComponentModel.DataAnnotations;
using POS.Application.DTOs.BetterToday;

namespace POS.Application.DTOs.Assistant;

public class AssistantUpdateTaskRequest
{
    [StringLength(200, MinimumLength = 1)]
    public string? Title { get; set; }

    [RegularExpression("^(work|leverage|health|stability)$")]
    public string? Category { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }

    [RegularExpression("^(inbox|today|done)$")]
    public string? Status { get; set; }

    [RegularExpression("^(low|medium|high|urgent)$")]
    public string? Priority { get; set; }

    public bool? Completed { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? PlannedDate { get; set; }

    public int? EstimatedMinutes { get; set; }

    public string? NextActionText { get; set; }
}

public class AssistantCloseSessionRequest
{
    /// <summary>progress | finished_task | did_not_start | left (default left)</summary>
    [RegularExpression("^(progress|finished_task|did_not_start|left)$")]
    public string? Outcome { get; set; }

    public string? ReturnPoint { get; set; }

    public string? Notes { get; set; }
}

public class AssistantSetBetterItemsRequest
{
    /// <summary>yyyy-MM-dd. Defaults to today when omitted.</summary>
    [RegularExpression(@"^\d{4}-\d{2}-\d{2}$")]
    public string? Date { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(3)]
    public List<AssistantBetterItemInput> Items { get; set; } = [];
}
