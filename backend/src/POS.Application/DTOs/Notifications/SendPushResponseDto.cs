namespace POS.Application.DTOs.Notifications;

public class SendPushResponseDto
{
    public NotificationDto Notification { get; set; } = new();
    public int TokensTargeted { get; set; }
    public int PushTicketsAccepted { get; set; }
    public List<string> Errors { get; set; } = new();
}
