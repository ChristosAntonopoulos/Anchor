using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Notifications;
using POS.Application.Services.Notifications;

namespace POS.Application.Services.Push;

public class PushNotificationService
{
    private readonly DevicePushTokenService _tokens;
    private readonly ExpoPushSender _expo;
    private readonly NotificationService _notifications;
    private readonly ILogger<PushNotificationService> _logger;

    public PushNotificationService(
        DevicePushTokenService tokens,
        ExpoPushSender expo,
        NotificationService notifications,
        ILogger<PushNotificationService> logger)
    {
        _tokens = tokens;
        _expo = expo;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<SendPushResponseDto> SendAsync(SendPushRequest request, string userId, CancellationToken cancellationToken = default)
    {
        var deepLink = string.IsNullOrWhiteSpace(request.DeepLink)
            ? "pos://os/now"
            : request.DeepLink.Trim();

        var create = new CreateNotificationRequest
        {
            NotificationId = $"assistant-push:{Guid.NewGuid():N}",
            Title = request.Title.Trim(),
            Text = request.Body.Trim(),
            PackageName = "com.pos.mobile",
            AppName = "Anchor",
            PostTime = DateTime.UtcNow,
            ChannelId = "os-assistant-priority",
            ChannelName = "Assistant",
            Importance = "high",
            Priority = 4,
            IsTaskRelevant = true,
            Tag = string.IsNullOrWhiteSpace(request.Category) ? "assistant-push" : $"assistant-push:{request.Category.Trim()}",
            DeepLink = deepLink,
            Category = request.Category?.Trim()
        };

        var stored = await _notifications.CreateNotificationAsync(create, userId);

        var devices = await _tokens.ListForUserAsync(userId);
        var tokenValues = devices.Select(d => d.Token).ToList();
        if (tokenValues.Count == 0)
        {
            _logger.LogWarning(
                "Assistant push for user {UserId} has tokensTargeted=0 — no device has POSTed /api/devices/push-token. In-app notification {NotificationId} was still stored.",
                userId,
                stored.Id);
        }
        else
        {
            _logger.LogInformation(
                "Sending assistant push to {Count} device(s) for user {UserId} notification {NotificationId} deepLink {DeepLink}",
                tokenValues.Count,
                userId,
                stored.Id,
                deepLink);
        }

        var data = new Dictionary<string, object?>
        {
            ["url"] = deepLink,
            ["deepLink"] = deepLink,
            ["category"] = request.Category,
            ["notificationId"] = stored.Id,
            ["kind"] = "assistant-push"
        };

        var pushResult = await _expo.SendAsync(
            tokenValues,
            create.Title,
            create.Text,
            data,
            cancellationToken);

        _logger.LogInformation(
            "Assistant push result for user {UserId}: tokensTargeted={TokensTargeted} ticketsAccepted={TicketsAccepted} errors={ErrorCount}",
            userId,
            pushResult.TokensTargeted,
            pushResult.TicketsAccepted,
            pushResult.Errors.Count);

        // Drop DeviceNotRegistered tokens so the next send stays clean
        foreach (var error in pushResult.Errors)
        {
            if (error.Contains("DeviceNotRegistered", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("Expo reported DeviceNotRegistered; consider pruning tokens");
            }
            else
            {
                _logger.LogWarning("Expo push error for user {UserId}: {Error}", userId, error);
            }
        }

        return new SendPushResponseDto
        {
            Notification = stored,
            TokensTargeted = pushResult.TokensTargeted,
            PushTicketsAccepted = pushResult.TicketsAccepted,
            Errors = pushResult.Errors
        };
    }
}
