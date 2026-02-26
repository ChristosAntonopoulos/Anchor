using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// Phone unlock entry - tracks when user unlocks their phone and their reason
/// </summary>
public class PhoneUnlockEntry : EntityBase
{
    [BsonElement("reason")]
    public string Reason { get; set; } = string.Empty; // User's reason for unlocking

    [BsonElement("unlockedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UnlockedAt { get; set; } // Timestamp of unlock event

    [BsonElement("unlockMethod")]
    public string? UnlockMethod { get; set; } // How phone was unlocked (if detectable)
}
