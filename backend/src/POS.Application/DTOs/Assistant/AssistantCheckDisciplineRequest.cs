using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Assistant;

/// <summary>
/// Check off a discipline habit for today (toggle = true, or increment counter).
/// Match by itemId (e.g. Workout1) or itemName (case-insensitive contains).
/// </summary>
public class AssistantCheckDisciplineRequest
{
    /// <summary>
    /// Stable id: DietFollowed, Workout1, Workout2, Hydration, Read10Pages, ProgressPhoto, …
    /// </summary>
    [StringLength(64)]
    public string? ItemId { get; set; }

    /// <summary>
    /// Human label match when ItemId is omitted (e.g. "Read 10 pages").
    /// </summary>
    [StringLength(200)]
    public string? ItemName { get; set; }

    /// <summary>
    /// Optional block id: 75Hard or HabitTracking
    /// </summary>
    [StringLength(64)]
    public string? BlockId { get; set; }

    /// <summary>
    /// For toggles: value to set (default true). Ignored for counters (always increments by 1).
    /// </summary>
    public bool? Checked { get; set; }
}
