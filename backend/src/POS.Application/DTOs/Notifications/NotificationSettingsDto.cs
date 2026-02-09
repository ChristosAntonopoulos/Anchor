using POS.Application.DTOs;

namespace POS.Application.DTOs.Notifications;

/// <summary>
/// Notification settings DTO
/// </summary>
public class NotificationSettingsDto : ResponseDto
{
    public List<string> WhitelistedApps { get; set; } = new();
    public List<string> BlacklistedApps { get; set; } = new();
    public bool AutoSubmitEnabled { get; set; }
    public int RetentionDays { get; set; }
    public List<string> CustomKeywords { get; set; } = new();
}

/// <summary>
/// Update notification settings request
/// </summary>
public class UpdateNotificationSettingsRequest
{
    public List<string>? WhitelistedApps { get; set; }
    public List<string>? BlacklistedApps { get; set; }
    public bool? AutoSubmitEnabled { get; set; }
    public int? RetentionDays { get; set; }
    public List<string>? CustomKeywords { get; set; }
}
