using POS.Application.DTOs;

namespace POS.Application.DTOs.Notifications;

/// <summary>
/// Notification DTO with all metadata
/// </summary>
public class NotificationDto : ResponseDto
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

    // User interaction flags
    public bool IsDismissed { get; set; }
    public bool IsRead { get; set; }
    public bool IsTaskRelevant { get; set; }
    public bool IsIgnored { get; set; }
}

/// <summary>
/// Notification action DTO
/// </summary>
public class NotificationActionDto
{
    public string Title { get; set; } = string.Empty;
    public string? Intent { get; set; }
}
