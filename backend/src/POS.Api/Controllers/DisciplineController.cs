using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Discipline;
using POS.Application.Services.Discipline;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Discipline endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Discipline")]
public class DisciplineController : BaseController
{
    private readonly DisciplineService _disciplineService;

    public DisciplineController(DisciplineService disciplineService)
    {
        _disciplineService = disciplineService;
    }

    /// <summary>
    /// Get today's discipline entry
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDiscipline()
    {
        var userId = GetUserId();
        var discipline = await _disciplineService.GetTodayDisciplineAsync(userId);
        return Success(discipline);
    }

    /// <summary>
    /// Update today's discipline entry (general update, e.g., note)
    /// </summary>
    [HttpPut]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateDiscipline([FromBody] UpdateDisciplineRequest request)
    {
        var userId = GetUserId();
        var discipline = await _disciplineService.UpdateDisciplineAsync(request, userId);
        return Success(discipline);
    }

    /// <summary>
    /// Toggle a toggle item
    /// </summary>
    [HttpPatch("{date}/block/{blockId}/item/{itemId}/toggle")]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleItem(
        [FromRoute] string date,
        [FromRoute] string blockId,
        [FromRoute] string itemId,
        [FromBody] bool value)
    {
        var userId = GetUserId();
        if (!DateTime.TryParse(date, out var dateTime))
        {
            return BadRequest("Invalid date format");
        }
        
        var discipline = await _disciplineService.UpdateToggleAsync(userId, dateTime, blockId, itemId, value);
        return Success(discipline);
    }

    /// <summary>
    /// Increment a counter item
    /// </summary>
    [HttpPatch("{date}/block/{blockId}/item/{itemId}/increment")]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> IncrementCounter(
        [FromRoute] string date,
        [FromRoute] string blockId,
        [FromRoute] string itemId)
    {
        var userId = GetUserId();
        if (!DateTime.TryParse(date, out var dateTime))
        {
            return BadRequest("Invalid date format");
        }
        
        var discipline = await _disciplineService.IncrementCounterAsync(userId, dateTime, blockId, itemId);
        return Success(discipline);
    }

    /// <summary>
    /// Decrement a counter item
    /// </summary>
    [HttpPatch("{date}/block/{blockId}/item/{itemId}/decrement")]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DecrementCounter(
        [FromRoute] string date,
        [FromRoute] string blockId,
        [FromRoute] string itemId)
    {
        var userId = GetUserId();
        if (!DateTime.TryParse(date, out var dateTime))
        {
            return BadRequest("Invalid date format");
        }
        
        var discipline = await _disciplineService.DecrementCounterAsync(userId, dateTime, blockId, itemId);
        return Success(discipline);
    }

    /// <summary>
    /// Set counter to specific value
    /// </summary>
    [HttpPatch("{date}/block/{blockId}/item/{itemId}/set")]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetCounter(
        [FromRoute] string date,
        [FromRoute] string blockId,
        [FromRoute] string itemId,
        [FromBody] int value)
    {
        var userId = GetUserId();
        if (!DateTime.TryParse(date, out var dateTime))
        {
            return BadRequest("Invalid date format");
        }
        
        var discipline = await _disciplineService.SetCounterAsync(userId, dateTime, blockId, itemId, value);
        return Success(discipline);
    }

    /// <summary>
    /// Create discipline entry
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateDiscipline([FromBody] CreateDisciplineRequest request)
    {
        var userId = GetUserId();
        var discipline = await _disciplineService.CreateDisciplineAsync(request, userId);
        return Success(discipline, "Discipline entry created successfully");
    }

    /// <summary>
    /// Get discipline entry by date
    /// </summary>
    [HttpGet("{date}")]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDisciplineByDate([FromRoute] string date)
    {
        var userId = GetUserId();
        if (!DateTime.TryParse(date, out var dateTime))
        {
            return BadRequest("Invalid date format. Use YYYY-MM-DD");
        }
        
        var discipline = await _disciplineService.GetDisciplineByDateAsync(userId, dateTime);
        if (discipline == null)
        {
            return NotFound("Discipline entry not found for this date");
        }
        return Success(discipline);
    }

    /// <summary>
    /// Get discipline entries by date range
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<DisciplineEntryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDisciplineByDateRange([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var userId = GetUserId();
        
        if (startDate.HasValue && endDate.HasValue)
        {
            var entries = await _disciplineService.GetDisciplineByDateRangeAsync(userId, startDate.Value, endDate.Value);
            return Success(entries);
        }
        
        // If no date range provided, return today's entry (existing behavior)
        var discipline = await _disciplineService.GetTodayDisciplineAsync(userId);
        return Success(discipline);
    }

    /// <summary>
    /// Delete discipline entry by date
    /// </summary>
    [HttpDelete("{date}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteDiscipline([FromRoute] string date)
    {
        var userId = GetUserId();
        if (!DateTime.TryParse(date, out var dateTime))
        {
            return BadRequest("Invalid date format. Use YYYY-MM-DD");
        }
        
        var deleted = await _disciplineService.DeleteDisciplineAsync(userId, dateTime);
        if (!deleted)
        {
            return NotFound("Discipline entry not found for this date");
        }
        return Success("Discipline entry deleted successfully");
    }
}
