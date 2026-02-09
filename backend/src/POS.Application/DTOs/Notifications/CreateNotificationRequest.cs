namespace POS.Application.DTOs.Notifications;

/// <summary>
/// Create notification request
/// </summary>
public class CreateNotificationRequest
{
    // Core notification data
    public string NotificationId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string? SubText { get; set; }
    public string PackageName { get; set; } = string.Empty;
    public DateTime PostTime { get; set; }
    public string? Tag { get; set; }

    // Rich metadata
    public string? AppName { get; set; }
    public string? AppIcon { get; set; }
    public string? LargeText { get; set; }
    public string? BigPicture { get; set; }
    public string? ChannelId { get; set; }
    public string? ChannelName { get; set; }
    public int? Priority { get; set; }
    public string? Importance { get; set; }
    public List<NotificationActionDto>? Actions { get; set; }
    public string? GroupKey { get; set; }
    public string? SortKey { get; set; }

    // Task relevance flag (set by frontend based on keyword detection)
    public bool IsTaskRelevant { get; set; }
}
