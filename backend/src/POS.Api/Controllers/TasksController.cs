using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
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
    /// <returns>List of tasks for today, ordered by priority and order</returns>
    /// <remarks>
    /// Returns all tasks assigned to today's date for the current user.
    /// Tasks are ordered by priority (high to low) and then by order field.
    /// </remarks>
    /// <response code="200">List of today's tasks retrieved successfully</response>
    /// <response code="500">Internal server error occurred</response>
    /// <example>
    /// Success response:
    /// <code>
    /// {
    ///   "success": true,
    ///   "data": [
    ///     {
    ///       "id": "507f1f77bcf86cd799439011",
    ///       "title": "Complete project documentation",
    ///       "category": "Work",
    ///       "priority": 5,
    ///       "completed": false,
    ///       "dueDate": "2024-02-26T17:00:00Z"
    ///     }
    ///   ],
    ///   "message": null,
    ///   "errors": null,
    ///   "timestamp": "2024-02-26T15:30:00Z"
    /// }
    /// </code>
    /// </example>
    [HttpGet]
    [SwaggerOperation(OperationId = "Tasks_GetTasks", Summary = "Get all tasks for today")]
    [ProducesResponseType(typeof(ApiResponse<List<TaskDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTasks()
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTodayTasksAsync(userId);
        return Success(tasks);
    }

    /// <summary>
    /// Create a new task with optional features like location, reminders, and recurrence
    /// </summary>
    /// <param name="request">Task creation request. Title and Category are required.</param>
    /// <returns>Created task with generated ID and timestamps</returns>
    /// <remarks>
    /// Example request:
    /// <code>
    /// {
    ///   "title": "Review project proposal",
    ///   "category": "work",
    ///   "notes": "Check budget section",
    ///   "dueDate": "2024-02-28T10:00:00Z",
    ///   "priority": "high",
    ///   "estimatedMinutes": 60
    /// }
    /// </code>
    /// 
    /// Valid category values: work, leverage, health, stability
    /// Valid priority values: low, medium, high, urgent
    /// </remarks>
    /// <response code="200">Task created successfully</response>
    /// <response code="400">Validation error - missing required fields or invalid data</response>
    /// <response code="500">Internal server error occurred</response>
    /// <example>
    /// Success response:
    /// <code>
    /// {
    ///   "success": true,
    ///   "data": {
    ///     "id": "507f1f77bcf86cd799439011",
    ///     "title": "Complete project documentation",
    ///     "category": "Work",
    ///     "priority": 5,
    ///     "completed": false
    ///   },
    ///   "message": "Task created successfully",
    ///   "errors": null,
    ///   "timestamp": "2024-02-26T15:30:00Z"
    /// }
    /// </code>
    /// Error response (400):
    /// <code>
    /// {
    ///   "success": false,
    ///   "data": null,
    ///   "message": "Validation failed",
    ///   "errors": [
    ///     {
    ///       "field": "title",
    ///       "message": "Title is required",
    ///       "code": "REQUIRED_FIELD"
    ///     }
    ///   ],
    ///   "timestamp": "2024-02-26T15:30:00Z"
    /// }
    /// </code>
    /// </example>
    [HttpPost]
    [SwaggerOperation(OperationId = "Tasks_CreateTask", Summary = "Create a new task")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.CreateTaskAsync(request, userId);
        return Success(task);
    }

    /// <summary>
    /// Mark a task as completed
    /// </summary>
    /// <param name="id">Task ID from the URL path</param>
    /// <param name="request">Complete task request containing the task ID</param>
    /// <returns>Success message</returns>
    /// <remarks>
    /// The ID in the URL path must match the ID in the request body.
    /// Example request body:
    /// <code>
    /// {
    ///   "id": "507f1f77bcf86cd799439011"
    /// }
    /// </code>
    /// </remarks>
    /// <response code="200">Task completed successfully</response>
    /// <response code="400">Validation error - ID mismatch or task not found</response>
    [HttpPost("{id}/complete")]
    [SwaggerOperation(OperationId = "Tasks_CompleteTask", Summary = "Mark a task as completed")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    /// Update a task with partial update (only provided fields will be updated)
    /// </summary>
    /// <param name="id">Task ID to update</param>
    /// <param name="request">Update request with fields to modify. All fields are optional.</param>
    /// <returns>Updated task</returns>
    /// <remarks>
    /// This is a partial update - only include the fields you want to change.
    /// Example request:
    /// <code>
    /// {
    ///   "title": "Updated title",
    ///   "priority": "urgent",
    ///   "completed": true
    /// }
    /// </code>
    /// </remarks>
    /// <response code="200">Task updated successfully</response>
    /// <response code="400">Validation error - invalid data</response>
    /// <response code="404">Task not found</response>
    [HttpPatch("{id}")]
    [SwaggerOperation(OperationId = "Tasks_UpdateTask", Summary = "Update a task (partial update)")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateTask(string id, [FromBody] UpdateTaskRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.UpdateTaskAsync(id, request, userId);
        return Success(task);
    }

    /// <summary>
    /// Delete a task by ID
    /// </summary>
    /// <param name="id">Task ID to delete</param>
    /// <returns>Success message</returns>
    /// <remarks>
    /// Permanently deletes the task. This action cannot be undone.
    /// </remarks>
    /// <response code="200">Task deleted successfully</response>
    /// <response code="404">Task not found</response>
    [HttpDelete("{id}")]
    [SwaggerOperation(OperationId = "Tasks_DeleteTask", Summary = "Delete a task by ID")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    /// Get tasks near a specific location
    /// </summary>
    /// <param name="latitude">Latitude of the location (required)</param>
    /// <param name="longitude">Longitude of the location (required)</param>
    /// <param name="radiusKm">Search radius in kilometers (optional, defaults to 5.0)</param>
    /// <returns>List of tasks within the specified radius of the location</returns>
    /// <remarks>
    /// Returns all tasks that have a location set and are within the specified radius.
    /// Coordinates should be in decimal degrees (WGS84).
    /// Example: latitude=40.7128, longitude=-74.0060 (New York City)
    /// </remarks>
    /// <response code="200">List of nearby tasks retrieved successfully</response>
    /// <response code="400">Validation error - invalid coordinates</response>
    [HttpGet("nearby")]
    [SwaggerOperation(OperationId = "Tasks_GetTasksNearby", Summary = "Get tasks near a specific location")]
    [ProducesResponseType(typeof(ApiResponse<List<TaskDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTasksNearby([FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] double? radiusKm = 5.0)
    {
        var userId = GetUserId();
        var tasks = await _taskService.GetTasksNearLocationAsync(userId, latitude, longitude, radiusKm ?? 5.0);
        return Success(tasks);
    }
}
