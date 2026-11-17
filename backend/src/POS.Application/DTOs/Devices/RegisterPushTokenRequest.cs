using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Devices;

/// <summary>
/// Register or refresh this device's Expo push token.
/// </summary>
public class RegisterPushTokenRequest
{
    [Required]
    [StringLength(512, MinimumLength = 8)]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// android | ios | web
    /// </summary>
    [StringLength(32)]
    public string? Platform { get; set; }

    [StringLength(128)]
    public string? ExpoProjectId { get; set; }
}
