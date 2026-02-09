using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Notifications;

/// <summary>
/// Notification entity - stores Android notifications with rich metadata
/// </summary>
public class Notification : EntityBase
{
    // Core notification data
    [BsonElement("notificationId")]
    public string NotificationId { get; set; } = string.Empty; // Android notification ID

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("subText")]
    public string? SubText { get; set; }

    [BsonElement("packageName")]
    public string PackageName { get; set; } = string.Empty;

    [BsonElement("postTime")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime PostTime { get; set; }

    [BsonElement("tag")]
    public string? Tag { get; set; }

    // Rich metadata
    [BsonElement("appName")]
    public string? AppName { get; set; }

    [BsonElement("appIcon")]
    public string? AppIcon { get; set; } // Base64 encoded or reference

    [BsonElement("largeText")]
    public string? LargeText { get; set; }

    [BsonElement("bigPicture")]
    public string? BigPicture { get; set; } // Base64 encoded image or URL

    [BsonElement("channelId")]
    public string? ChannelId { get; set; }

    [BsonElement("channelName")]
    public string? ChannelName { get; set; }

    [BsonElement("priority")]
    public int? Priority { get; set; } // Deprecated priority (0-5)

    [BsonElement("importance")]
    public string? Importance { get; set; } // none|min|low|default|high

    [BsonElement("actions")]
    public List<NotificationAction>? Actions { get; set; }

    [BsonElement("groupKey")]
    public string? GroupKey { get; set; }

    [BsonElement("sortKey")]
    public string? SortKey { get; set; }

    // User interaction flags
    [BsonElement("isDismissed")]
    public bool IsDismissed { get; set; }

    [BsonElement("isRead")]
    public bool IsRead { get; set; }

    [BsonElement("isTaskRelevant")]
    public bool IsTaskRelevant { get; set; } // Flag for task relevance

    [BsonElement("isIgnored")]
    public bool IsIgnored { get; set; } // Based on app whitelist/blacklist
}

/// <summary>
/// Notification action (button in notification)
/// </summary>
public class NotificationAction
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("intent")]
    public string? Intent { get; set; } // Intent action or data
}
