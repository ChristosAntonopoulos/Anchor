using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Notifications;

/// <summary>
/// Send a real push to registered devices and store an in-app notification.
/// </summary>
public class SendPushRequest
{
    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// Deep link opened on tap, e.g. pos://os/now or pos://os/night
    /// </summary>
    [StringLength(500)]
    public string? DeepLink { get; set; }

    /// <summary>
    /// Optional category label (today, night, discipline, …)
    /// </summary>
    [StringLength(64)]
    public string? Category { get; set; }
}
