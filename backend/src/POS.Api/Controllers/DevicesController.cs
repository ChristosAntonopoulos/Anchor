using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Devices;
using POS.Application.Services.Push;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Device registration (Expo / FCM push tokens).
/// </summary>
[ApiController]
[Route("api/devices")]
[Tags("Devices")]
public class DevicesController : BaseController
{
    private readonly DevicePushTokenService _tokens;

    public DevicesController(DevicePushTokenService tokens)
    {
        _tokens = tokens;
    }

    /// <summary>
    /// Register or refresh this phone's Expo push token for the current user.
    /// </summary>
    [HttpPost("push-token")]
    [SwaggerOperation(
        OperationId = "Devices_RegisterPushToken",
        Summary = "Register Expo push token",
        Description = "Call once after install (and whenever the token rotates). Required for POST /api/notifications/push.")]
    [ProducesResponseType(typeof(ApiResponse<DevicePushTokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterPushToken([FromBody] RegisterPushTokenRequest request)
    {
        var userId = GetUserId();
        var result = await _tokens.RegisterAsync(request, userId);
        return Success(result, "Push token registered");
    }
}
