using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// Phone unlock entry - tracks when user unlocks their phone and their reason
/// </summary>
public class PhoneUnlockEntry : EntityBase
{
    [BsonElement("reason")]
    public string Reason { get; set; } = string.Empty;

    [BsonElement("unlockedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UnlockedAt { get; set; }

    [BsonElement("unlockMethod")]
    public string? UnlockMethod { get; set; }

    [BsonElement("promptId")]
    public string? PromptId { get; set; }

    [BsonElement("schemaVersion")]
    public int SchemaVersion { get; set; } = 2;

    [BsonElement("unlockEventId")]
    public string? UnlockEventId { get; set; }

    [BsonElement("shownAtUtc")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ShownAtUtc { get; set; }

    [BsonElement("utcOffsetMinutesAtShown")]
    public int? UtcOffsetMinutesAtShown { get; set; }

    [BsonElement("resolvedAtUtc")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ResolvedAtUtc { get; set; }

    [BsonElement("status")]
    public string? Status { get; set; }

    [BsonElement("action")]
    public string? Action { get; set; }

    [BsonElement("intentionCode")]
    public string? IntentionCode { get; set; }

    [BsonElement("triggerCode")]
    public string? TriggerCode { get; set; }

    [BsonElement("feelingCode")]
    public string? FeelingCode { get; set; }

    [BsonElement("note")]
    public string? Note { get; set; }

    [BsonElement("contextExpanded")]
    public bool ContextExpanded { get; set; }

    [BsonElement("submissionPath")]
    public string? SubmissionPath { get; set; }

    [BsonElement("putDownExecution")]
    public string? PutDownExecution { get; set; }
}
