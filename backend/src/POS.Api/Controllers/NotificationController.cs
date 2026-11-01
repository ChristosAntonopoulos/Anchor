using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Notifications;
using POS.Application.Services.Notifications;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Notification endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Notifications")]
public class NotificationController : BaseController
{
    private readonly NotificationService _notificationService;

    public NotificationController(NotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>
    /// Create a notification
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequest request)
    {
        var userId = GetUserId();
        var notification = await _notificationService.CreateNotificationAsync(request, userId);
        return Success(notification);
    }

    /// <summary>
    /// Get notifications with filtering, grouping, and pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] string? groupBy = null,
        [FromQuery] string? filter = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var (notifications, totalCount) = await _notificationService.GetNotificationsAsync(
            userId, groupBy, filter, search, page, limit);

        return Success(new
        {
            notifications,
            totalCount,
            page,
            limit,
            totalPages = (int)Math.Ceiling(totalCount / (double)limit)
        });
    }

    /// <summary>
    /// Get a single notification
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetNotification(string id)
    {
        var userId = GetUserId();
        var notification = await _notificationService.GetNotificationAsync(id, userId);
        return Success(notification);
    }

    /// <summary>
    /// Update a notification (mark read/dismissed)
    /// </summary>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateNotification(string id, [FromBody] UpdateNotificationRequest request)
    {
        if (request.Id != id)
        {
            return BadRequest("Id in URL must match id in request body");
        }

        var userId = GetUserId();
        var notification = await _notificationService.UpdateNotificationAsync(id, request, userId);
        return Success(notification);
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteNotification(string id)
    {
        var userId = GetUserId();
        await _notificationService.DeleteNotificationAsync(id, userId);
        return Success("Notification deleted successfully");
    }

    /// <summary>
    /// Get notification insights
    /// </summary>
    [HttpGet("insights")]
    [ProducesResponseType(typeof(ApiResponse<NotificationInsightsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetNotificationInsights(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var userId = GetUserId();
        var insights = await _notificationService.GetNotificationInsightsAsync(userId, startDate, endDate);
        return Success(insights);
    }

    /// <summary>
    /// Get notification settings
    /// </summary>
    [HttpGet("settings")]
    [ProducesResponseType(typeof(ApiResponse<NotificationSettingsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetNotificationSettings()
    {
        var userId = GetUserId();
        var settings = await _notificationService.GetNotificationSettingsAsync(userId);
        return Success(settings);
    }

    /// <summary>
    /// Update notification settings
    /// </summary>
    [HttpPut("settings")]
    [ProducesResponseType(typeof(ApiResponse<NotificationSettingsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateNotificationSettings([FromBody] UpdateNotificationSettingsRequest request)
    {
        var userId = GetUserId();
        var settings = await _notificationService.UpdateNotificationSettingsAsync(request, userId);
        return Success(settings);
    }

    /// <summary>
    /// Get list of apps from notifications
    /// </summary>
    [HttpGet("apps")]
    [SwaggerOperation(OperationId = "Notifications_GetApps", Summary = "Get list of apps from notifications")]
    [ProducesResponseType(typeof(ApiResponse<List<AppNotificationCount>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetApps()
    {
        var userId = GetUserId();
        var apps = await _notificationService.GetAppListAsync(userId);
        return Success(apps);
    }
}
