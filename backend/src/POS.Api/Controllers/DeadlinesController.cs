using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Deadlines;
using POS.Application.Services.Deadlines;
using POS.Core.Exceptions;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Deadlines endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Deadlines")]
public class DeadlinesController : BaseController
{
    private readonly DeadlineService _deadlineService;

    public DeadlinesController(DeadlineService deadlineService)
    {
        _deadlineService = deadlineService;
    }

    /// <summary>
    /// Get all active deadlines
    /// </summary>
    [HttpGet]
    [SwaggerOperation(OperationId = "Deadlines_GetDeadlines", Summary = "Get all active deadlines")]
    [ProducesResponseType(typeof(ApiResponse<List<DeadlineDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDeadlines()
    {
        var userId = GetUserId();
        var deadlines = await _deadlineService.GetAllDeadlinesAsync(userId);
        return Success(deadlines);
    }

    /// <summary>
    /// Create a new deadline
    /// </summary>
    /// <param name="request">Deadline creation request. Title and DueDate are required.</param>
    /// <returns>Created deadline with generated ID</returns>
    /// <remarks>
    /// Example request:
    /// <code>
    /// {
    ///   "title": "Project submission",
    ///   "dueDate": "2024-03-15",
    ///   "importance": 5
    /// }
    /// </code>
    /// Date format: YYYY-MM-DD
    /// Importance: 1-5 (1 = low, 5 = critical). Defaults to 3 if not provided.
    /// </remarks>
    /// <response code="200">Deadline created successfully</response>
    /// <response code="400">Validation error - missing required fields or invalid data</response>
    [HttpPost]
    [SwaggerOperation(OperationId = "Deadlines_CreateDeadline", Summary = "Create a new deadline")]
    [ProducesResponseType(typeof(ApiResponse<DeadlineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateDeadline([FromBody] CreateDeadlineRequest request)
    {
        var userId = GetUserId();
        var deadline = await _deadlineService.CreateDeadlineAsync(request, userId);
        return Success(deadline);
    }

    /// <summary>
    /// Update a deadline
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<DeadlineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateDeadline(string id, [FromBody] UpdateDeadlineRequest request)
    {
        if (request.Id != id)
        {
            return BadRequest("Id in URL must match id in request body");
        }

        var userId = GetUserId();
        var deadline = await _deadlineService.UpdateDeadlineAsync(request, userId);
        return Success(deadline);
    }

    /// <summary>
    /// Delete a deadline
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteDeadline(string id)
    {
        var userId = GetUserId();
        var deleted = await _deadlineService.DeleteDeadlineAsync(id, userId);
        if (deleted)
        {
            return Success("Deadline deleted successfully");
        }
        return NotFound("Deadline not found");
    }
}
