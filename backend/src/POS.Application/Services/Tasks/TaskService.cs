using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Tasks;
using POS.Core.Entities.Tasks;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Tasks;

/// <summary>
/// Service for managing tasks
/// </summary>
public class TaskService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<TaskService> _logger;

    public TaskService(MongoDbContext context, IMapper mapper, ILogger<TaskService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get all tasks for today
    /// </summary>
    public async Task<List<TaskDto>> GetTodayTasksAsync(string userId)
    {
        _logger.LogInformation("Getting today's tasks for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<POS.Core.Entities.Tasks.Task>.Filter.And(
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.UserId, userId),
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.Date, today)
        );
        
        var taskEntities = await _context.Tasks.Find(filter).ToListAsync();
        return _mapper.Map<List<TaskDto>>(taskEntities);
    }

    /// <summary>
    /// Create a task
    /// </summary>
    public async Task<TaskDto> CreateTaskAsync(CreateTaskRequest request, string userId)
    {
        _logger.LogInformation("Creating task for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var task = _mapper.Map<POS.Core.Entities.Tasks.Task>(request);
        task.UserId = userId;
        task.Date = today;
        task.Completed = false;
        task.Source = "user";
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;
        
        await _context.Tasks.InsertOneAsync(task);
        return _mapper.Map<TaskDto>(task);
    }

    /// <summary>
    /// Complete a task
    /// </summary>
    public async System.Threading.Tasks.Task CompleteTaskAsync(CompleteTaskRequest request, string userId)
    {
        _logger.LogInformation("Completing task {TaskId} for user {UserId}", request.Id, userId);
        
        var filter = Builders<POS.Core.Entities.Tasks.Task>.Filter.And(
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.Id, request.Id),
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.UserId, userId)
        );
        
        var update = Builders<POS.Core.Entities.Tasks.Task>.Update
            .Set(t => t.Completed, true)
            .Set(t => t.CompletedAt, DateTime.UtcNow)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);
        
        var result = await _context.Tasks.UpdateOneAsync(filter, update);
        if (result.MatchedCount == 0)
        {
            throw new NotFoundException("Task", request.Id);
        }
    }

    /// <summary>
    /// Update a task (partial update)
    /// </summary>
    public async Task<TaskDto> UpdateTaskAsync(string id, UpdateTaskRequest request, string userId)
    {
        _logger.LogInformation("Updating task {TaskId} for user {UserId}", id, userId);
        
        var filter = Builders<POS.Core.Entities.Tasks.Task>.Filter.And(
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.Id, id),
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.UserId, userId)
        );

        var existingTask = await _context.Tasks.Find(filter).FirstOrDefaultAsync();
        if (existingTask == null)
        {
            throw new NotFoundException("Task", id);
        }

        // Build update document dynamically based on provided fields
        var updateBuilder = Builders<POS.Core.Entities.Tasks.Task>.Update
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        if (request.Title != null) updateBuilder = updateBuilder.Set(t => t.Title, request.Title);
        if (request.Category != null) updateBuilder = updateBuilder.Set(t => t.Category, request.Category);
        if (request.Completed.HasValue)
        {
            updateBuilder = updateBuilder.Set(t => t.Completed, request.Completed.Value);
            if (request.Completed.Value)
            {
                updateBuilder = updateBuilder.Set(t => t.CompletedAt, DateTime.UtcNow);
            }
        }
        if (request.Notes != null) updateBuilder = updateBuilder.Set(t => t.Notes, request.Notes);
        if (request.PrivateNotes != null) updateBuilder = updateBuilder.Set(t => t.PrivateNotes, request.PrivateNotes);
        if (request.Subtasks != null)
        {
            var subtasks = _mapper.Map<List<Subtask>>(request.Subtasks);
            updateBuilder = updateBuilder.Set(t => t.Subtasks, subtasks);
        }
        if (request.Location != null)
        {
            var location = _mapper.Map<Location>(request.Location);
            updateBuilder = updateBuilder.Set(t => t.Location, location);
        }
        if (request.DueDate.HasValue) updateBuilder = updateBuilder.Set(t => t.DueDate, request.DueDate.Value);
        if (request.Priority != null) updateBuilder = updateBuilder.Set(t => t.Priority, request.Priority);
        if (request.Recurrence != null)
        {
            var recurrence = _mapper.Map<RecurrencePattern>(request.Recurrence);
            updateBuilder = updateBuilder.Set(t => t.Recurrence, recurrence);
        }
        if (request.Tags != null) updateBuilder = updateBuilder.Set(t => t.Tags, request.Tags);
        if (request.EstimatedMinutes.HasValue) updateBuilder = updateBuilder.Set(t => t.EstimatedMinutes, request.EstimatedMinutes.Value);
        if (request.Reminders != null)
        {
            var reminders = _mapper.Map<List<Reminder>>(request.Reminders);
            updateBuilder = updateBuilder.Set(t => t.Reminders, reminders);
        }
        if (request.Order.HasValue) updateBuilder = updateBuilder.Set(t => t.Order, request.Order.Value);

        await _context.Tasks.UpdateOneAsync(filter, updateBuilder);
        
        var updatedTask = await _context.Tasks.Find(filter).FirstOrDefaultAsync();
        return _mapper.Map<TaskDto>(updatedTask!);
    }

    /// <summary>
    /// Get tasks near a location
    /// </summary>
    public async Task<List<TaskDto>> GetTasksNearLocationAsync(string userId, double latitude, double longitude, double radiusKm = 5.0)
    {
        _logger.LogInformation("Getting tasks near location for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<POS.Core.Entities.Tasks.Task>.Filter.And(
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.UserId, userId),
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.Date, today),
            Builders<POS.Core.Entities.Tasks.Task>.Filter.And(
                Builders<POS.Core.Entities.Tasks.Task>.Filter.Ne(t => t.Location, null),
                Builders<POS.Core.Entities.Tasks.Task>.Filter.Ne(t => t.Location!.Latitude, null),
                Builders<POS.Core.Entities.Tasks.Task>.Filter.Ne(t => t.Location!.Longitude, null)
            )
        );

        var tasks = await _context.Tasks.Find(filter).ToListAsync();
        
        // Filter by distance (simple distance calculation)
        var nearbyTasks = tasks.Where(task =>
        {
            if (task.Location?.Latitude == null || task.Location.Longitude == null)
                return false;

            var distance = CalculateDistance(
                latitude, longitude,
                task.Location.Latitude.Value, task.Location.Longitude.Value
            );
            return distance <= radiusKm;
        }).ToList();

        return _mapper.Map<List<TaskDto>>(nearbyTasks);
    }

    /// <summary>
    /// Calculate distance between two coordinates in kilometers (Haversine formula)
    /// </summary>
    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth radius in kilometers
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double degrees) => degrees * Math.PI / 180;

    /// <summary>
    /// Delete a task
    /// </summary>
    public async Task<bool> DeleteTaskAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting task {TaskId} for user {UserId}", id, userId);
        
        var filter = Builders<POS.Core.Entities.Tasks.Task>.Filter.And(
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.Id, id),
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.UserId, userId)
        );
        
        var result = await _context.Tasks.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }
}
