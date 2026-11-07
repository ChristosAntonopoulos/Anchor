using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Notifications;

/// <summary>
/// User notification preferences and settings
/// </summary>
public class NotificationSettings : EntityBase
{
    [BsonElement("whitelistedApps")]
    public List<string> WhitelistedApps { get; set; } = new(); // Package names to monitor

    [BsonElement("blacklistedApps")]
    public List<string> BlacklistedApps { get; set; } = new(); // Package names to ignore

    [BsonElement("autoSubmitEnabled")]
    public bool AutoSubmitEnabled { get; set; } = false; // For future use

    [BsonElement("retentionDays")]
    public int RetentionDays { get; set; } = 30; // How long to keep notifications

    [BsonElement("customKeywords")]
    public List<string> CustomKeywords { get; set; } = new(); // Keywords for task relevance detection
}
