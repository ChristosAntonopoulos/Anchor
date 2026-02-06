using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Schedule;
using POS.Application.Services.Schedule;
using POS.Core.Exceptions;

namespace POS.Api.Controllers;

/// <summary>
/// Schedule endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ScheduleController : BaseController
{
    private readonly ScheduleService _scheduleService;

    public ScheduleController(ScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    /// <summary>
    /// Get all schedule blocks for today
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSchedule()
    {
        var userId = GetUserId();
        var schedule = await _scheduleService.GetTodayScheduleAsync(userId);
        return Success(schedule);
    }

    /// <summary>
    /// Create a schedule block definition
    /// </summary>
    [HttpPost("definitions")]
    public async Task<IActionResult> CreateDefinition([FromBody] CreateScheduleBlockDefinitionDto dto)
    {
        var userId = GetUserId();
        var definition = await _scheduleService.CreateDefinitionAsync(dto, userId);
        return Success(definition);
    }

    /// <summary>
    /// Update a schedule block
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBlock(string id, [FromBody] UpdateScheduleBlockRequest request)
    {
        if (request.Id != id)
        {
            return BadRequest("Id in URL must match id in request body");
        }

        var userId = GetUserId();
        var block = await _scheduleService.UpdateBlockAsync(request, userId);
        return Success(block);
    }

    /// <summary>
    /// Delete a schedule block
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBlock(string id)
    {
        var userId = GetUserId();
        var deleted = await _scheduleService.DeleteBlockAsync(id, userId);
        if (deleted)
        {
            return Success("Schedule block deleted successfully");
        }
        return NotFound("Schedule block not found");
    }
}
