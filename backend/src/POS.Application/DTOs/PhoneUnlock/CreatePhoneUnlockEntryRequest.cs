using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.PhoneUnlock;

/// <summary>
/// Create or upsert a phone unlock prompt record using structured intention codes.
/// </summary>
public class CreatePhoneUnlockEntryRequest
{
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
