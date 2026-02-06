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
        var task = new POS.Core.Entities.Tasks.Task
        {
            UserId = userId,
            Date = today,
            Title = request.Title,
            Category = request.Category,
            Completed = false,
            Source = "user"
        };
        
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
            .Set(t => t.UpdatedAt, DateTime.UtcNow);
        
        var result = await _context.Tasks.UpdateOneAsync(filter, update);
        if (result.MatchedCount == 0)
        {
            throw new NotFoundException("Task", request.Id);
        }
    }

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
