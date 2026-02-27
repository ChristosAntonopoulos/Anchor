using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Diet;
using POS.Application.Services.Diet;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Diet endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Diet")]
public class DietController : BaseController
{
    private readonly DietService _dietService;

    public DietController(DietService dietService)
    {
        _dietService = dietService;
    }

    /// <summary>
    /// Get today's diet entry
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DietEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDiet()
    {
        var userId = GetUserId();
        var diet = await _dietService.GetTodayDietAsync(userId);
        return Success(diet);
    }

    /// <summary>
    /// Update today's diet entry
    /// </summary>
    [HttpPut]
    [ProducesResponseType(typeof(ApiResponse<DietEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateDiet([FromBody] UpdateDietRequest request)
    {
        var userId = GetUserId();
        var diet = await _dietService.UpdateDietAsync(request, userId);
        return Success(diet);
    }

    /// <summary>
    /// Create diet entry
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DietEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateDiet([FromBody] CreateDietRequest request)
    {
        var userId = GetUserId();
        var diet = await _dietService.CreateDietAsync(request, userId);
        return Success(diet, "Diet entry created successfully");
    }

    /// <summary>
    /// Get diet entry by date
    /// </summary>
    [HttpGet("{date}")]
    [ProducesResponseType(typeof(ApiResponse<DietEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDietByDate([FromRoute] string date)
    {
        var userId = GetUserId();
        if (!DateTime.TryParse(date, out var dateTime))
        {
            return BadRequest("Invalid date format. Use YYYY-MM-DD");
        }
        
        var diet = await _dietService.GetDietByDateAsync(userId, dateTime);
        if (diet == null)
        {
            return NotFound("Diet entry not found for this date");
        }
        return Success(diet);
    }

    /// <summary>
    /// Get diet entries by date range
    /// </summary>
    [HttpGet("range")]
    [ProducesResponseType(typeof(ApiResponse<DietEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<DietEntryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDietByDateRange([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var userId = GetUserId();
        
        if (startDate.HasValue && endDate.HasValue)
        {
            var entries = await _dietService.GetDietByDateRangeAsync(userId, startDate.Value, endDate.Value);
            return Success(entries);
        }
        
        // If no date range provided, return today's entry (existing behavior)
        var diet = await _dietService.GetTodayDietAsync(userId);
        return Success(diet);
    }

    /// <summary>
    /// Delete diet entry by date
    /// </summary>
    [HttpDelete("{date}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteDiet([FromRoute] string date)
    {
        var userId = GetUserId();
        if (!DateTime.TryParse(date, out var dateTime))
        {
            return BadRequest("Invalid date format. Use YYYY-MM-DD");
        }
        
        var deleted = await _dietService.DeleteDietAsync(userId, dateTime);
        if (!deleted)
        {
            return NotFound("Diet entry not found for this date");
        }
        return Success("Diet entry deleted successfully");
    }
}
