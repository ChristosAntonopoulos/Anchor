using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.PhoneUnlock;

/// <summary>
/// Create or upsert a phone unlock prompt record.
/// Schema version 1 requires <see cref="Reason"/>. Schema version 2 stores structured codes.
/// </summary>
public class CreatePhoneUnlockEntryRequest
{
    /// <summary>
    /// Compatibility reason string. Required for schema version 1. For schema version 2 this is
    /// the intention code when one was reported, otherwise empty. Never invent "No reason".
    /// </summary>
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string? Reason { get; set; }

    public DateTime? UnlockedAt { get; set; }

    [StringLength(50, ErrorMessage = "Unlock method cannot exceed 50 characters")]
    public string? UnlockMethod { get; set; }

    public string? PromptId { get; set; }

    public int SchemaVersion { get; set; }

    public string? UnlockEventId { get; set; }

    public DateTime? ShownAtUtc { get; set; }

    public int? UtcOffsetMinutesAtShown { get; set; }

    public DateTime? ResolvedAtUtc { get; set; }

    public string? Status { get; set; }

    public string? Action { get; set; }

    public string? IntentionCode { get; set; }

    public string? TriggerCode { get; set; }

    public string? FeelingCode { get; set; }

    [StringLength(200, ErrorMessage = "Note cannot exceed 200 characters")]
    public string? Note { get; set; }

    public bool ContextExpanded { get; set; }

    public string? SubmissionPath { get; set; }

    public string? PutDownExecution { get; set; }
}
