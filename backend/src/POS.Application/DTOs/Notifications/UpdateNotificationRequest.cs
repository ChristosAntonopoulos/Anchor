using POS.Application.DTOs;

namespace POS.Application.DTOs.Notifications;

/// <summary>
/// Update notification request (for marking read/dismissed)
/// </summary>
public class UpdateNotificationRequest : UpdateDto
{
    public bool? IsDismissed { get; set; }
    public bool? IsRead { get; set; }
    public bool? IsIgnored { get; set; }
}
