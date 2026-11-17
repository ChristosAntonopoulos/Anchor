namespace POS.Application.DTOs.Devices;

/// <summary>
/// Registration health for assistant checks — never includes raw push tokens.
/// </summary>
public class PushTokenRegistrationStatusDto
{
    public string UserId { get; set; } = string.Empty;
    public int TokenCount { get; set; }
    public DateTime? LastRegisteredAt { get; set; }
    public List<string> Platforms { get; set; } = new();
}
