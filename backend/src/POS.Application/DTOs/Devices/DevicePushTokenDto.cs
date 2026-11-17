namespace POS.Application.DTOs.Devices;

public class DevicePushTokenDto
{
    public string Id { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public DateTime LastSeenAt { get; set; }
}
