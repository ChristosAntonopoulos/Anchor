using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Schedule;
using POS.Application.Services.Schedule;
using POS.Core.Exceptions;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Schedule endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Schedule")]
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
    [ProducesResponseType(typeof(ApiResponse<List<ScheduleBlockInstanceDto>>), StatusCodes.Status200OK)]
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
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockDefinitionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
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
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockInstanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
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
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
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

    /// <summary>
    /// Get schedule block instance by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockInstanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetBlockInstanceById(string id)
    {
        var userId = GetUserId();
        var block = await _scheduleService.GetBlockInstanceByIdAsync(id, userId);
        if (block == null)
        {
            return NotFound("Schedule block not found");
        }
        return Success(block);
    }

    /// <summary>
    /// Get all schedule block definitions
    /// </summary>
    [HttpGet("definitions")]
    [ProducesResponseType(typeof(ApiResponse<List<ScheduleBlockDefinitionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllDefinitions()
    {
        var userId = GetUserId();
        var definitions = await _scheduleService.GetAllDefinitionsAsync(userId);
        return Success(definitions);
    }

    /// <summary>
    /// Get schedule block definition by ID
    /// </summary>
    [HttpGet("definitions/{id}")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockDefinitionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDefinitionById(string id)
    {
        var userId = GetUserId();
        var definition = await _scheduleService.GetDefinitionByIdAsync(id, userId);
        if (definition == null)
        {
            return NotFound("Schedule block definition not found");
        }
        return Success(definition);
    }

    /// <summary>
    /// Update schedule block definition
    /// </summary>
    [HttpPut("definitions/{id}")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockDefinitionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateDefinition(string id, [FromBody] UpdateScheduleBlockDefinitionRequest request)
    {
        var userId = GetUserId();
        var definition = await _scheduleService.UpdateDefinitionAsync(id, request, userId);
        if (definition == null)
        {
            return NotFound("Schedule block definition not found");
        }
        return Success(definition);
    }

    /// <summary>
    /// Delete schedule block definition
    /// </summary>
    [HttpDelete("definitions/{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteDefinition(string id)
    {
        var userId = GetUserId();
        var deleted = await _scheduleService.DeleteDefinitionAsync(id, userId);
        if (!deleted)
        {
            return NotFound("Schedule block definition not found");
        }
        return Success("Schedule block definition deleted successfully");
    }
}
