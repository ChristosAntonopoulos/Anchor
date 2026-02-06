using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Deadlines;
using POS.Application.Services.Deadlines;
using POS.Core.Exceptions;

namespace POS.Api.Controllers;

/// <summary>
/// Deadlines endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
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
    public async Task<IActionResult> GetDeadlines()
    {
        var userId = GetUserId();
        var deadlines = await _deadlineService.GetAllDeadlinesAsync(userId);
        return Success(deadlines);
    }

    /// <summary>
    /// Create a deadline
    /// </summary>
    [HttpPost]
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
