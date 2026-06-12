using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Tasks;
using POS.Application.Services.Tasks;
using POS.Core.Constants;
using POS.Shared.Results;

namespace POS.Api.Controllers;

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
    /// Today's focus list (max 5 active tasks).
    /// </summary>
    [HttpGet("today")]
    [SwaggerOperation(OperationId = "Tasks_GetTodayFocus", Summary = "Get today's focus tasks")]
    [ProducesResponseType(typeof(ApiResponse<List<TaskDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTodayFocus()
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTodayFocusTasksAsync(userId);
        return Success(tasks);
    }

    /// <summary>
    /// Inbox / backlog (unlimited capture list).
    /// </summary>
    [HttpGet("inbox")]
    [SwaggerOperation(OperationId = "Tasks_GetInbox", Summary = "Get inbox tasks")]
    [ProducesResponseType(typeof(ApiResponse<TaskInboxResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInbox([FromQuery] int limit = TaskLimits.DefaultInboxPageSize)
    {
        var userId = GetUserId();
        var items = await _taskService.GetInboxTasksAsync(userId, limit);
        var total = await _taskService.GetInboxCountAsync(userId);
        return Success(new TaskInboxResponseDto { Items = items, TotalCount = total });
    }

    /// <summary>
    /// Back-compat: same as GET /api/tasks/today
    /// </summary>
    [HttpGet]
    [SwaggerOperation(OperationId = "Tasks_GetTasks", Summary = "Get all tasks for today (focus list)")]
    [ProducesResponseType(typeof(ApiResponse<List<TaskDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTasks()
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTodayFocusTasksAsync(userId);
        return Success(tasks);
    }

    [HttpPost]
    [SwaggerOperation(OperationId = "Tasks_CreateTask", Summary = "Create a new task")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request)
    {
        var userId = GetUserId();
        try
        {
            var task = await _taskService.CreateTaskAsync(request, userId);
            return Success(task, "Task created successfully");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/promote")]
    [SwaggerOperation(OperationId = "Tasks_PromoteToToday", Summary = "Move task from inbox to today's focus")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PromoteToToday(string id)
    {
        var userId = GetUserId();
        try
        {
            var task = await _taskService.PromoteToTodayAsync(id, userId);
            return Success(task, "Task promoted to today");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (POS.Core.Exceptions.NotFoundException)
        {
            return NotFound("Task not found");
        }
    }

    [HttpPost("{id}/demote")]
    [SwaggerOperation(OperationId = "Tasks_DemoteToInbox", Summary = "Move task from today to inbox")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DemoteToInbox(string id)
    {
        var userId = GetUserId();
        try
        {
            var task = await _taskService.DemoteToInboxAsync(id, userId);
            return Success(task, "Task moved to inbox");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (POS.Core.Exceptions.NotFoundException)
        {
            return NotFound("Task not found");
        }
    }

    [HttpPost("{id}/complete")]
    [SwaggerOperation(OperationId = "Tasks_CompleteTask", Summary = "Mark a task as completed")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompleteTask(string id, [FromBody] CompleteTaskRequest request)
    {
        if (request.Id != id)
            return BadRequest("Id in URL must match id in request body");

        var userId = GetUserId();
        await _taskService.CompleteTaskAsync(request, userId);
        return Success("Task completed successfully");
    }

    [HttpPatch("{id}")]
    [SwaggerOperation(OperationId = "Tasks_UpdateTask", Summary = "Update a task (partial update)")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTask(string id, [FromBody] UpdateTaskRequest request)
    {
        var userId = GetUserId();
        try
        {
            var task = await _taskService.UpdateTaskAsync(id, request, userId);
            return Success(task);
        }
        catch (POS.Core.Exceptions.NotFoundException)
        {
            return NotFound("Task not found");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [SwaggerOperation(OperationId = "Tasks_DeleteTask", Summary = "Delete a task by ID")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTask(string id)
    {
        var userId = GetUserId();
        var deleted = await _taskService.DeleteTaskAsync(id, userId);
        if (deleted)
            return Success("Task deleted successfully");
        return NotFound("Task not found");
    }

    [HttpGet("nearby")]
    [SwaggerOperation(OperationId = "Tasks_GetTasksNearby", Summary = "Get tasks near a location")]
    [ProducesResponseType(typeof(ApiResponse<List<TaskDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTasksNearby([FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] double? radiusKm = 5.0)
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTasksNearLocationAsync(userId, latitude, longitude, radiusKm ?? 5.0);
        return Success(tasks);
    }
}
