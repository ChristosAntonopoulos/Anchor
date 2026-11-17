using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Assistant;

public class AssistantHabitUpsertRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string ItemId { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string ItemName { get; set; } = string.Empty;

    /// <summary>toggle | counter</summary>
    [RegularExpression("^(toggle|counter)$")]
    public string? Type { get; set; }

    public string? BlockId { get; set; }

    public string? BlockName { get; set; }

    public int? BlockOrder { get; set; }

    public bool? Active { get; set; }

    /// <summary>0=Sun … 6=Sat. Null = every day. Empty array clears to every day.</summary>
    public int[]? DaysOfWeek { get; set; }

    public int? Order { get; set; }

    public bool? Enabled { get; set; }
}

public class AssistantHabitPatchRequest
{
    [StringLength(200, MinimumLength = 1)]
    public string? ItemName { get; set; }

    [RegularExpression("^(toggle|counter)$")]
    public string? Type { get; set; }

    public string? BlockId { get; set; }

    public string? BlockName { get; set; }

    public int? BlockOrder { get; set; }

    public bool? Active { get; set; }

    public int[]? DaysOfWeek { get; set; }

    public int? Order { get; set; }

    public bool? Enabled { get; set; }
}

public class AssistantHabitDto
{
    public string Id { get; set; } = string.Empty;
    public string ItemId { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Type { get; set; } = "toggle";
    public string BlockId { get; set; } = string.Empty;
    public string BlockName { get; set; } = string.Empty;
    public int BlockOrder { get; set; }
    public bool Active { get; set; } = true;
    public int[]? DaysOfWeek { get; set; }
    public int Order { get; set; }
    public bool Protected { get; set; }
    public bool Enabled { get; set; } = true;
}
