using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Notifications;
using POS.Application.Services.Push;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Assistant push delivery. Requires header X-Anchor-Key when AnchorApi:RequireKey is true and Key is configured.
/// </summary>
[ApiController]
[Route("api/notifications")]
[Tags("Notifications")]
public class NotificationsPushController : BaseController
{
    private readonly PushNotificationService _push;

    public NotificationsPushController(PushNotificationService push)
    {
        _push = push;
    }

    /// <summary>
    /// Send a real push immediately and store it in the in-app notification list.
    /// </summary>
    [HttpPost("push")]
    [SwaggerOperation(
        OperationId = "Notifications_SendPush",
        Summary = "Send push + store in-app notification",
        Description = "Requires X-Anchor-Key when AnchorApi:RequireKey is true. Sends via Expo to all registered device tokens for the user, and creates an in-app notification. Uses calm channel os-assistant (default priority, respects DND). Tap opens deepLink (default pos://os/now). If tokensTargeted is 0, the phone has not POSTed /api/devices/push-token yet — check GET /api/devices/push-token.")]
    [ProducesResponseType(typeof(ApiResponse<SendPushResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SendPush([FromBody] SendPushRequest request, CancellationToken cancellationToken)
    {
        var result = await _push.SendAsync(request, GetUserId(), cancellationToken);
        return Success(result, "Push accepted");
    }
}
