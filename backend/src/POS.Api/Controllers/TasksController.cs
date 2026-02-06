using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Tasks;
using POS.Application.Services.Tasks;
using POS.Core.Exceptions;

namespace POS.Api.Controllers;

/// <summary>
/// Tasks endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
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
    /// Delete a task
    /// </summary>
    [HttpDelete("{id}")]
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
}
