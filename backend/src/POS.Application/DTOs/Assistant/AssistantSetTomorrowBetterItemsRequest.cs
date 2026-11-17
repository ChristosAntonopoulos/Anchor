using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Assistant;

/// <summary>
/// Replace tomorrow's top 3 "What Makes Me Better Today" items.
/// </summary>
public class AssistantSetTomorrowBetterItemsRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(3)]
    public List<AssistantBetterItemInput> Items { get; set; } = new();
}

public class AssistantBetterItemInput
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// work | leverage | health | stability (default: work)
    /// </summary>
    [RegularExpression("^(work|leverage|health|stability)$")]
    public string? Category { get; set; }
}
