using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Discipline;
using POS.Application.Services.Discipline;

namespace POS.Api.Controllers;

/// <summary>
/// Discipline endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
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
}
