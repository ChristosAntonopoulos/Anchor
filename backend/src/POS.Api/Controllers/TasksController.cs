using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Tasks;
using POS.Application.Services.Tasks;
using POS.Core.Exceptions;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Tasks endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Tasks")]
public class TasksController : BaseController
{
    private readonly TaskService _taskService;

    public TasksController(TaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Get all tasks for today
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<TaskDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTasks()
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTodayTasksAsync(userId);
        return Success(tasks);
    }

    /// <summary>
    /// Create a task
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.CreateTaskAsync(request, userId);
        return Success(task);
    }

    /// <summary>
    /// Complete a task
    /// </summary>
    [HttpPost("{id}/complete")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompleteTask(string id, [FromBody] CompleteTaskRequest request)
    {
        if (request.Id != id)
        {
            return BadRequest("Id in URL must match id in request body");
        }

        var userId = GetUserId();
        await _taskService.CompleteTaskAsync(request, userId);
        return Success("Task completed successfully");
    }

    /// <summary>
    /// Update a task (partial update)
    /// </summary>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTask(string id, [FromBody] UpdateTaskRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.UpdateTaskAsync(id, request, userId);
        return Success(task);
    }

    /// <summary>
    /// Delete a task
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTask(string id)
    {
        var userId = GetUserId();
        var deleted = await _taskService.DeleteTaskAsync(id, userId);
        if (deleted)
        {
            return Success("Task deleted successfully");
        }
        return NotFound("Task not found");
    }

    /// <summary>
    /// Get tasks near a location
    /// </summary>
    [HttpGet("nearby")]
    [ProducesResponseType(typeof(ApiResponse<List<TaskDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTasksNearby([FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] double? radiusKm = 5.0)
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTasksNearLocationAsync(userId, latitude, longitude, radiusKm ?? 5.0);
        return Success(tasks);
    }
}
