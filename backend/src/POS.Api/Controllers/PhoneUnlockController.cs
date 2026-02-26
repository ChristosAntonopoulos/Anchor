using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
    /// Create phone unlock entry
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PhoneUnlockEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePhoneUnlockEntry([FromBody] CreatePhoneUnlockEntryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return ValidationError(new List<ErrorDetail>
            {
                new ErrorDetail { Field = "reason", Message = "Reason is required" }
            });
        }

        var userId = GetUserId();
        var entry = await _phoneUnlockService.CreatePhoneUnlockEntryAsync(request, userId);
        return Success(entry, "Phone unlock entry created successfully");
    }

    /// <summary>
    /// Get phone unlock entries (optionally filtered by date range)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PhoneUnlockEntryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPhoneUnlockEntries([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var userId = GetUserId();
        var entries = await _phoneUnlockService.GetPhoneUnlockEntriesAsync(userId, startDate, endDate);
        return Success(entries);
    }
}
