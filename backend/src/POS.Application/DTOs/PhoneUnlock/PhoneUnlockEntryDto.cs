namespace POS.Application.DTOs.PhoneUnlock;

/// <summary>
/// Phone unlock entry DTO
/// </summary>
public class PhoneUnlockEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime UnlockedAt { get; set; }
    public string? UnlockMethod { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? PromptId { get; set; }
    public int SchemaVersion { get; set; } = 2;
    public string? UnlockEventId { get; set; }
    public DateTime? ShownAtUtc { get; set; }
    public int? UtcOffsetMinutesAtShown { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
    public string? Status { get; set; }
    public string? Action { get; set; }
    public string? IntentionCode { get; set; }
    public string? TriggerCode { get; set; }
    public string? FeelingCode { get; set; }
    public string? Note { get; set; }
    public bool ContextExpanded { get; set; }
    public string? SubmissionPath { get; set; }
    public string? PutDownExecution { get; set; }
}
