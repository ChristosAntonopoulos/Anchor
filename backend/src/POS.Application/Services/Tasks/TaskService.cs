using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Tasks;
using POS.Core.Constants;
using POS.Core.Entities.Tasks;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;
using TaskEntity = POS.Core.Entities.Tasks.Task;
using TaskStatus = POS.Core.Constants.TaskStatus;

namespace POS.Application.Services.Tasks;

/// <summary>
/// Task management: inbox (capture) + today focus (limited execution list).
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
    /// One-time idempotent migration for documents created before status field existed.
    /// </summary>
    public async System.Threading.Tasks.Task MigrateLegacyStatusesAsync(CancellationToken ct = default)
    {
        var filter = Builders<TaskEntity>.Filter.Or(
            Builders<TaskEntity>.Filter.Exists(t => t.Status, false),
            Builders<TaskEntity>.Filter.Eq(t => t.Status, null),
            Builders<TaskEntity>.Filter.Eq(t => t.Status, ""));

        var legacy = await _context.Tasks.Find(filter).ToListAsync(ct);
        if (legacy.Count == 0)
            return;

        var today = DateTime.UtcNow.Date;
        _logger.LogInformation("Migrating {Count} legacy tasks to status field", legacy.Count);

        foreach (var task in legacy)
        {
            var status = task.Completed
                ? TaskStatus.Done
                : task.Date.Date == today
                    ? TaskStatus.Today
                    : TaskStatus.Inbox;

            var update = Builders<TaskEntity>.Update
                .Set(t => t.Status, status)
                .Set(t => t.UpdatedAt, DateTime.UtcNow);

            if (status == TaskStatus.Today && task.PlannedDate == null)
                update = update.Set(t => t.PlannedDate, today);

            await _context.Tasks.UpdateOneAsync(
                Builders<TaskEntity>.Filter.Eq(t => t.Id, task.Id),
                update,
                cancellationToken: ct);
        }
    }

    public async Task<List<TaskDto>> GetTodayFocusTasksAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        var filter = Builders<TaskEntity>.Filter.And(
            Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId),
            Builders<TaskEntity>.Filter.Eq(t => t.Status, TaskStatus.Today),
            Builders<TaskEntity>.Filter.Eq(t => t.Completed, false));

        var sort = Builders<TaskEntity>.Sort
            .Ascending(t => t.FocusRank)
            .Ascending(t => t.Order)
            .Descending(t => t.Priority)
            .Ascending(t => t.CreatedAt);

        var tasks = await _context.Tasks.Find(filter).Sort(sort).Limit(TaskLimits.MaxTodayFocus).ToListAsync();
        return _mapper.Map<List<TaskDto>>(tasks);
    }

    public async Task<List<TaskDto>> GetInboxTasksAsync(string userId, int limit = TaskLimits.DefaultInboxPageSize)
    {
        var now = DateTime.UtcNow;
        var filter = Builders<TaskEntity>.Filter.And(
            Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId),
            Builders<TaskEntity>.Filter.Eq(t => t.Status, TaskStatus.Inbox),
            Builders<TaskEntity>.Filter.Eq(t => t.Completed, false),
            Builders<TaskEntity>.Filter.Or(
                Builders<TaskEntity>.Filter.Eq(t => t.SnoozedUntil, null),
                Builders<TaskEntity>.Filter.Lte(t => t.SnoozedUntil, now)));

        var sort = Builders<TaskEntity>.Sort
            .Descending(t => t.CreatedAt);

        var tasks = await _context.Tasks.Find(filter).Sort(sort).Limit(limit).ToListAsync();
        return _mapper.Map<List<TaskDto>>(tasks);
    }

    public async Task<int> GetInboxCountAsync(string userId)
    {
        var now = DateTime.UtcNow;
        var filter = Builders<TaskEntity>.Filter.And(
            Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId),
            Builders<TaskEntity>.Filter.Eq(t => t.Status, TaskStatus.Inbox),
            Builders<TaskEntity>.Filter.Eq(t => t.Completed, false),
            Builders<TaskEntity>.Filter.Or(
                Builders<TaskEntity>.Filter.Eq(t => t.SnoozedUntil, null),
                Builders<TaskEntity>.Filter.Lte(t => t.SnoozedUntil, now)));

        return (int)await _context.Tasks.CountDocumentsAsync(filter);
    }

    /// <summary>
    /// Back-compat alias for today's focus list.
    /// </summary>
    public Task<List<TaskDto>> GetTodayTasksAsync(string userId) =>
        GetTodayFocusTasksAsync(userId);

    public async Task<TaskDto> CreateTaskAsync(CreateTaskRequest request, string userId)
    {
        _logger.LogInformation("Creating task for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var targetStatus = request.Status ?? TaskStatus.Inbox;

        if (targetStatus == TaskStatus.Today)
            await EnsureTodayCapacityAsync(userId, additional: 1);

        var task = _mapper.Map<TaskEntity>(request);
        task.UserId = userId;
        task.Source = "user";
        task.Status = targetStatus;
        task.Completed = false;
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;

        if (targetStatus == TaskStatus.Today)
        {
            task.Date = today;
            task.PlannedDate = today;
            task.FocusRank = await NextFocusRankAsync(userId);
        }
        else
        {
            task.Date = today;
            task.PlannedDate = null;
            task.FocusRank = null;
        }

        await _context.Tasks.InsertOneAsync(task);
        return _mapper.Map<TaskDto>(task);
    }

    public async Task<TaskDto> PromoteToTodayAsync(string id, string userId)
    {
        _logger.LogInformation("Promoting task {TaskId} to today for user {UserId}", id, userId);

        await EnsureTodayCapacityAsync(userId, additional: 1);

        var filter = UserTaskFilter(id, userId);
        var task = await _context.Tasks.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Task", id);

        if (task.Completed)
            throw new InvalidOperationException("Cannot promote a completed task.");

        if (task.Status == TaskStatus.Today)
            return _mapper.Map<TaskDto>(task);

        var today = DateTime.UtcNow.Date;
        var update = Builders<TaskEntity>.Update
            .Set(t => t.Status, TaskStatus.Today)
            .Set(t => t.Date, today)
            .Set(t => t.PlannedDate, today)
            .Set(t => t.FocusRank, await NextFocusRankAsync(userId))
            .Set(t => t.SnoozedUntil, null)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        await _context.Tasks.UpdateOneAsync(filter, update);
        var updated = await _context.Tasks.Find(filter).FirstOrDefaultAsync();
        return _mapper.Map<TaskDto>(updated!);
    }

    public async Task<TaskDto> DemoteToInboxAsync(string id, string userId)
    {
        _logger.LogInformation("Demoting task {TaskId} to inbox for user {UserId}", id, userId);

        var filter = UserTaskFilter(id, userId);
        var task = await _context.Tasks.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Task", id);

        if (task.Completed)
            throw new InvalidOperationException("Cannot demote a completed task.");

        var update = Builders<TaskEntity>.Update
            .Set(t => t.Status, TaskStatus.Inbox)
            .Set(t => t.PlannedDate, null)
            .Set(t => t.FocusRank, null)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        await _context.Tasks.UpdateOneAsync(filter, update);
        var updated = await _context.Tasks.Find(filter).FirstOrDefaultAsync();
        return _mapper.Map<TaskDto>(updated!);
    }

    public async System.Threading.Tasks.Task CompleteTaskAsync(CompleteTaskRequest request, string userId)
    {
        _logger.LogInformation("Completing task {TaskId} for user {UserId}", request.Id, userId);

        var filter = UserTaskFilter(request.Id, userId);
        var update = Builders<TaskEntity>.Update
            .Set(t => t.Completed, true)
            .Set(t => t.Status, TaskStatus.Done)
            .Set(t => t.CompletedAt, DateTime.UtcNow)
            .Set(t => t.FocusRank, null)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        var result = await _context.Tasks.UpdateOneAsync(filter, update);
        if (result.MatchedCount == 0)
            throw new NotFoundException("Task", request.Id);
    }

    public async Task<TaskDto> UpdateTaskAsync(string id, UpdateTaskRequest request, string userId)
    {
        _logger.LogInformation("Updating task {TaskId} for user {UserId}", id, userId);

        var filter = UserTaskFilter(id, userId);
        var existing = await _context.Tasks.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Task", id);

        var updateBuilder = Builders<TaskEntity>.Update
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        if (request.Title != null) updateBuilder = updateBuilder.Set(t => t.Title, request.Title);
        if (request.Category != null) updateBuilder = updateBuilder.Set(t => t.Category, request.Category);
        if (request.Completed.HasValue)
        {
            updateBuilder = updateBuilder.Set(t => t.Completed, request.Completed.Value);
            if (request.Completed.Value)
            {
                updateBuilder = updateBuilder
                    .Set(t => t.Status, TaskStatus.Done)
                    .Set(t => t.CompletedAt, DateTime.UtcNow)
                    .Set(t => t.FocusRank, null);
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
        if (request.FocusRank.HasValue) updateBuilder = updateBuilder.Set(t => t.FocusRank, request.FocusRank.Value);
        if (request.PlannedDate.HasValue) updateBuilder = updateBuilder.Set(t => t.PlannedDate, request.PlannedDate.Value);
        if (request.SnoozedUntil.HasValue) updateBuilder = updateBuilder.Set(t => t.SnoozedUntil, request.SnoozedUntil.Value);

        if (request.Status != null)
        {
            if (!TaskStatus.IsValid(request.Status))
                throw new ArgumentException($"Invalid status: {request.Status}");

            if (request.Status == TaskStatus.Today && existing.Status != TaskStatus.Today)
                await EnsureTodayCapacityAsync(userId, additional: 1);

            updateBuilder = updateBuilder.Set(t => t.Status, request.Status);

            if (request.Status == TaskStatus.Today)
            {
                var today = DateTime.UtcNow.Date;
                updateBuilder = updateBuilder
                    .Set(t => t.Date, today)
                    .Set(t => t.PlannedDate, today);
                if (existing.FocusRank == null)
                    updateBuilder = updateBuilder.Set(t => t.FocusRank, await NextFocusRankAsync(userId));
            }
            else if (request.Status == TaskStatus.Inbox)
            {
                updateBuilder = updateBuilder
                    .Set(t => t.PlannedDate, null)
                    .Set(t => t.FocusRank, null);
            }
        }

        await _context.Tasks.UpdateOneAsync(filter, updateBuilder);
        var updated = await _context.Tasks.Find(filter).FirstOrDefaultAsync();
        return _mapper.Map<TaskDto>(updated!);
    }

    public async Task<List<TaskDto>> GetTasksNearLocationAsync(string userId, double latitude, double longitude, double radiusKm = 5.0)
    {
        var today = DateTime.UtcNow.Date;
        var filter = Builders<TaskEntity>.Filter.And(
            Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId),
            Builders<TaskEntity>.Filter.Eq(t => t.Status, TaskStatus.Today),
            Builders<TaskEntity>.Filter.Eq(t => t.Completed, false),
            Builders<TaskEntity>.Filter.Ne(t => t.Location, null));

        var tasks = await _context.Tasks.Find(filter).ToListAsync();

        var nearby = tasks.Where(task =>
        {
            if (task.Location?.Latitude == null || task.Location.Longitude == null)
                return false;
            return CalculateDistance(latitude, longitude, task.Location.Latitude.Value, task.Location.Longitude.Value) <= radiusKm;
        }).ToList();

        return _mapper.Map<List<TaskDto>>(nearby);
    }

    public async Task<bool> DeleteTaskAsync(string id, string userId)
    {
        var filter = UserTaskFilter(id, userId);
        var result = await _context.Tasks.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }

    private static FilterDefinition<TaskEntity> UserTaskFilter(string id, string userId) =>
        Builders<TaskEntity>.Filter.And(
            Builders<TaskEntity>.Filter.Eq(t => t.Id, id),
            Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId));

    private async System.Threading.Tasks.Task EnsureTodayCapacityAsync(string userId, int additional)
    {
        var count = await _context.Tasks.CountDocumentsAsync(
            Builders<TaskEntity>.Filter.And(
                Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId),
                Builders<TaskEntity>.Filter.Eq(t => t.Status, TaskStatus.Today),
                Builders<TaskEntity>.Filter.Eq(t => t.Completed, false)));

        if (count + additional > TaskLimits.MaxTodayFocus)
        {
            throw new InvalidOperationException(
                $"Today's focus list is full ({TaskLimits.MaxTodayFocus} tasks). Move a task to inbox first.");
        }
    }

    private async Task<int> NextFocusRankAsync(string userId)
    {
        var filter = Builders<TaskEntity>.Filter.And(
            Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId),
            Builders<TaskEntity>.Filter.Eq(t => t.Status, TaskStatus.Today),
            Builders<TaskEntity>.Filter.Eq(t => t.Completed, false));

        var tasks = await _context.Tasks.Find(filter).Project(t => t.FocusRank).ToListAsync();
        var used = tasks.Where(r => r.HasValue).Select(r => r!.Value).ToHashSet();
        for (var i = 1; i <= TaskLimits.MaxTodayFocus; i++)
        {
            if (!used.Contains(i))
                return i;
        }
        return TaskLimits.MaxTodayFocus;
    }

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
