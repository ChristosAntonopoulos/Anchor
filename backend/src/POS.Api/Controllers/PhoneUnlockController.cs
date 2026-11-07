using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.PhoneUnlock;
using POS.Application.Services.PhoneUnlock;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Phone unlock endpoints
/// </summary>
[ApiController]
[Route("api/phone-unlock")]
[Tags("PhoneUnlock")]
public class PhoneUnlockController : BaseController
{
    private readonly PhoneUnlockService _phoneUnlockService;

    public PhoneUnlockController(PhoneUnlockService phoneUnlockService)
    {
        _phoneUnlockService = phoneUnlockService;
    }

    /// <summary>
    /// Create or upsert a phone unlock prompt record with structured intention codes.
    /// </summary>
    /// <param name="request">Phone unlock entry request.</param>
    /// <returns>Created or updated phone unlock entry with ID and timestamps</returns>
    /// <remarks>
    /// Example request:
    /// <code>
    /// {
    ///   "promptId": "8f1c2a12-3c44-4b1e-9d77-2c0c1b6a1111",
    ///   "schemaVersion": 2,
    ///   "status": "answered",
    ///   "action": "continue",
    ///   "intentionCode": "specific_task",
    ///   "shownAtUtc": "2024-02-26T15:30:00Z"
    /// }
    /// </code>
    /// </remarks>
    /// <response code="200">Phone unlock entry created successfully</response>
    /// <response code="400">Validation error - invalid data</response>
    /// <response code="500">Internal server error occurred</response>
    /// <example>
    /// Success response:
    /// <code>
    /// {
    ///   "success": true,
    ///   "data": {
    ///     "id": "507f1f77bcf86cd799439011",
    ///     "intentionCode": "specific_task",
    ///     "status": "answered",
    ///     "action": "continue",
    ///     "unlockedAt": "2024-02-26T15:30:00Z"
    ///   },
    ///   "message": "Phone unlock entry created successfully",
    ///   "errors": null,
    ///   "timestamp": "2024-02-26T15:30:00Z"
    /// }
    /// </code>
    /// </example>
    [HttpPost]
    [SwaggerOperation(OperationId = "PhoneUnlock_CreateEntry", Summary = "Create a new phone unlock entry")]
    [ProducesResponseType(typeof(ApiResponse<PhoneUnlockEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreatePhoneUnlockEntry([FromBody] CreatePhoneUnlockEntryRequest request)
    {
        var userId = GetUserId();
        var entry = await _phoneUnlockService.CreatePhoneUnlockEntryAsync(request, userId);
        return Success(entry, "Phone unlock entry created successfully");
    }

    /// <summary>
    /// Get all phone unlock entries, optionally filtered by date range
    /// </summary>
    /// <param name="startDate">Start date for filtering (optional). Format: ISO 8601 datetime</param>
    /// <param name="endDate">End date for filtering (optional). Format: ISO 8601 datetime</param>
    /// <returns>List of phone unlock entries, ordered by most recent first</returns>
    /// <remarks>
    /// If no date filters are provided, returns all entries for the current user.
    /// Date range is inclusive. Both dates are optional - can filter by start date only, end date only, or both.
    /// </remarks>
    /// <response code="200">List of phone unlock entries retrieved successfully</response>
    [HttpGet]
    [SwaggerOperation(OperationId = "PhoneUnlock_GetEntries", Summary = "Get all phone unlock entries")]
    [ProducesResponseType(typeof(ApiResponse<List<PhoneUnlockEntryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPhoneUnlockEntries([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var userId = GetUserId();
        var entries = await _phoneUnlockService.GetPhoneUnlockEntriesAsync(userId, startDate, endDate);
        return Success(entries);
    }
}
