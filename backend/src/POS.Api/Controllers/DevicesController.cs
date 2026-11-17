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
    /// Works without X-Anchor-Key when AnchorApi:RequireKey is false (device registration is also exempt when RequireKey is on).
    /// </summary>
    [HttpPost("push-token")]
    [SwaggerOperation(
        OperationId = "Devices_RegisterPushToken",
        Summary = "Register Expo push token",
        Description = "Call once after install (and whenever the token rotates). Required for POST /api/notifications/push. No raw-token dump on GET.")]
    [ProducesResponseType(typeof(ApiResponse<DevicePushTokenDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterPushToken([FromBody] RegisterPushTokenRequest request)
    {
        var userId = GetUserId();
        var result = await _tokens.RegisterAsync(request, userId);
        return Success(result, "Push token registered");
    }

    /// <summary>
    /// Read-only registration status for the current user (token count + last seen). Never returns raw tokens.
    /// </summary>
    [HttpGet("push-token")]
    [SwaggerOperation(
        OperationId = "Devices_GetPushTokenStatus",
        Summary = "Push token registration status",
        Description = "Returns tokenCount, lastRegisteredAt, and platforms for the user. Does not return raw Expo/FCM tokens.")]
    [ProducesResponseType(typeof(ApiResponse<PushTokenRegistrationStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPushTokenStatus()
    {
        var userId = GetUserId();
        var status = await _tokens.GetRegistrationStatusAsync(userId);
        return Success(status);
    }

    /// <summary>
    /// Clear all stored push tokens for the current user (does not return raw tokens).
    /// </summary>
    [HttpDelete("push-token")]
    [SwaggerOperation(
        OperationId = "Devices_ClearPushTokens",
        Summary = "Clear registered push tokens",
        Description = "Deletes every stored Expo/FCM token for the user. Useful after probe tokens or reinstall.")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ClearPushTokens()
    {
        var userId = GetUserId();
        var removed = await _tokens.ClearAllForUserAsync(userId);
        return Success(new { userId, removed }, "Push tokens cleared");
    }
}
