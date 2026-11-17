using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Assistant;
using POS.Application.DTOs.BetterToday;
using POS.Application.DTOs.Discipline;
using POS.Application.DTOs.Execution;
using POS.Application.DTOs.Routine;
using POS.Application.DTOs.Schedule;
using POS.Application.DTOs.Tasks;
using POS.Application.Services.BetterToday;
using POS.Application.Services.Discipline;
using POS.Application.Services.Execution;
using POS.Application.Services.Schedule;
using POS.Application.Services.Tasks;
using POS.Core.Entities.BetterToday;
using POS.Core.Entities.Schedule;
using POS.Core.Schedule;
using POS.Infrastructure.Data;
using POS.Infrastructure.Services;

namespace POS.Application.Services.Assistant;

public class AssistantWriteService
{
    private readonly TaskService _taskService;
    private readonly DisciplineService _disciplineService;
    private readonly HabitDefinitionService _habits;
    private readonly BetterItemService _betterItemService;
    private readonly ScheduleService _scheduleService;
    private readonly ScheduleMaterializationService _materialization;
    private readonly RoutineDefinitionService _routines;
    private readonly ExecutionService _execution;
    private readonly MongoDbContext _context;
    private readonly ILogger<AssistantWriteService> _logger;

    public AssistantWriteService(
        TaskService taskService,
        DisciplineService disciplineService,
        HabitDefinitionService habits,
        BetterItemService betterItemService,
        ScheduleService scheduleService,
        ScheduleMaterializationService materialization,
        RoutineDefinitionService routines,
        ExecutionService execution,
        MongoDbContext context,
        ILogger<AssistantWriteService> logger)
    {
        _taskService = taskService;
        _disciplineService = disciplineService;
        _habits = habits;
        _betterItemService = betterItemService;
        _scheduleService = scheduleService;
        _materialization = materialization;
        _routines = routines;
        _execution = execution;
        _context = context;
        _logger = logger;
    }

    public Task<TaskDto> CreateTaskAsync(AssistantCreateTaskRequest request, string userId)
    {
        var create = new CreateTaskRequest
        {
            Title = request.Title.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "work" : request.Category.Trim(),
            Notes = request.Notes,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "inbox" : request.Status.Trim(),
            Priority = request.Priority
        };
        return _taskService.CreateTaskAsync(create, userId);
    }

    public Task<TaskDto> UpdateTaskAsync(string id, AssistantUpdateTaskRequest request, string userId)
    {
        var update = new UpdateTaskRequest
        {
            Title = request.Title,
            Category = request.Category,
            Notes = request.Notes,
            Status = request.Status,
            Priority = request.Priority,
            Completed = request.Completed,
            DueDate = request.DueDate,
            PlannedDate = request.PlannedDate,
            EstimatedMinutes = request.EstimatedMinutes,
            NextActionText = request.NextActionText,
        };
        return _taskService.UpdateTaskAsync(id, update, userId);
    }

    public Task<bool> DeleteTaskAsync(string id, string userId) =>
        _taskService.DeleteTaskAsync(id, userId);

    public async Task<DisciplineEntryDto> CheckDisciplineAsync(AssistantCheckDisciplineRequest request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.ItemId) && string.IsNullOrWhiteSpace(request.ItemName))
            throw new ArgumentException("Provide itemId or itemName.");

        var today = DateTime.UtcNow.Date;
        var entry = await _disciplineService.GetTodayDisciplineAsync(userId);
        var match = FindItem(entry, request.BlockId, request.ItemId, request.ItemName);
        if (match == null)
            throw new ArgumentException("Discipline item not found. Use itemId (e.g. Workout1) or itemName.");

        var (blockId, item) = match.Value;
        _logger.LogInformation(
            "Assistant checking discipline {BlockId}/{ItemId} type {Type} for {UserId}",
            blockId, item.ItemId, item.Type, userId);

        if (string.Equals(item.Type, "toggle", StringComparison.OrdinalIgnoreCase))
            return await _disciplineService.UpdateToggleAsync(userId, today, blockId, item.ItemId, request.Checked ?? true);

        return await _disciplineService.IncrementCounterAsync(userId, today, blockId, item.ItemId);
    }

    public Task<List<AssistantHabitDto>> ListHabitsAsync(string userId) =>
        _habits.ListAsync(userId);

    public Task<AssistantHabitDto> UpsertHabitAsync(AssistantHabitUpsertRequest request, string userId) =>
        _habits.UpsertAsync(userId, request);

    public Task<AssistantHabitDto> PatchHabitAsync(string itemId, AssistantHabitPatchRequest request, string userId) =>
        _habits.PatchAsync(userId, itemId, request);

    public Task<AssistantHabitDto> PauseHabitAsync(string itemId, string userId) =>
        _habits.SetActiveAsync(userId, itemId, active: false);

    public Task<AssistantHabitDto> ResumeHabitAsync(string itemId, string userId) =>
        _habits.SetActiveAsync(userId, itemId, active: true);

    public Task DeleteHabitAsync(string itemId, string userId) =>
        _habits.DeleteAsync(userId, itemId);

    public Task<List<BetterItemDto>> SetTomorrowTop3Async(AssistantSetTomorrowBetterItemsRequest request, string userId) =>
        SetBetterItemsForDateAsync(new AssistantSetBetterItemsRequest
        {
            Date = DateTime.UtcNow.Date.AddDays(1).ToString("yyyy-MM-dd"),
            Items = request.Items,
        }, userId);

    public async Task<List<BetterItemDto>> SetBetterItemsForDateAsync(
        AssistantSetBetterItemsRequest request,
        string userId)
    {
        if (request.Items.Count is < 1 or > 3)
            throw new ArgumentException("Provide 1 to 3 items.");

        var date = string.IsNullOrWhiteSpace(request.Date)
            ? DateTime.UtcNow.Date
            : DateTime.Parse(request.Date).Date;

        var filter = Builders<BetterItem>.Filter.And(
            Builders<BetterItem>.Filter.Eq(b => b.UserId, userId),
            Builders<BetterItem>.Filter.Eq(b => b.Date, date));
        await _context.BetterItems.DeleteManyAsync(filter);

        var created = new List<BetterItemDto>();
        foreach (var item in request.Items)
        {
            created.Add(await _betterItemService.CreateBetterItemAsync(new CreateBetterItemDto
            {
                Title = item.Title.Trim(),
                Category = string.IsNullOrWhiteSpace(item.Category) ? "work" : item.Category.Trim(),
                Date = date,
                Source = "assistant",
            }, userId));
        }

        return created;
    }

    public Task<List<BetterItemDto>> GetBetterItemsAsync(string userId, string? date)
    {
        if (string.IsNullOrWhiteSpace(date))
            return _betterItemService.GetAllBetterItemsAsync(userId);

        var d = DateTime.Parse(date).Date;
        return _betterItemService.GetAllBetterItemsAsync(userId, d, d);
    }

    public Task<bool> DeleteBetterItemAsync(string id, string userId) =>
        _betterItemService.DeleteBetterItemAsync(id, userId);

    public async Task<List<ScheduleBlockDefinitionDto>> ListScheduleBlocksAsync(string userId)
    {
        await _materialization.EnsureDefaultDefinitionsAsync(userId);
        return await _scheduleService.GetAllDefinitionsAsync(userId);
    }

    public async Task<ScheduleBlockDefinitionDto> UpsertScheduleBlockAsync(
        AssistantScheduleBlockUpsertRequest request,
        string userId)
    {
        await _materialization.EnsureDefaultDefinitionsAsync(userId);
        var existing = (await _scheduleService.GetAllDefinitionsAsync(userId))
            .FirstOrDefault(d => string.Equals(d.Title, request.Title.Trim(), StringComparison.OrdinalIgnoreCase));

        if (existing == null)
        {
            var create = new CreateScheduleBlockDefinitionDto
            {
                Title = request.Title.Trim(),
                Kind = request.Kind ?? "fixed",
                Recurrence = request.Recurrence ?? "daily",
                DaysOfWeek = request.DaysOfWeek,
                FixedStartTime = request.FixedStartTime,
                FixedEndTime = request.FixedEndTime,
                DurationMinutes = request.DurationMinutes
                    ?? ComputeDurationMinutes(request.FixedStartTime, request.FixedEndTime),
                PreferredTimeTag = request.PreferredTimeTag,
                Energy = request.Energy ?? "medium",
                Tags = request.Tags ?? Array.Empty<string>(),
                Enabled = request.Enabled ?? true,
                Priority = request.Priority ?? 3,
            };
            var created = await _scheduleService.CreateDefinitionAsync(create, userId);
            if (request.RoutineActivities != null || request.ShorterRoutineActivities != null)
            {
                return await UpdateDefinitionFieldsAsync(created.Id, request, userId)
                    ?? created;
            }

            return created;
        }

        return await UpdateDefinitionFieldsAsync(existing.Id, request, userId)
            ?? throw new InvalidOperationException("Failed to update schedule block.");
    }

    public async Task<ScheduleBlockDefinitionDto> UpdateScheduleBlockAsync(
        string id,
        AssistantScheduleBlockUpsertRequest request,
        string userId)
    {
        var updated = await UpdateDefinitionFieldsAsync(id, request, userId);
        return updated ?? throw new ArgumentException($"Schedule block '{id}' not found.");
    }

    public Task<bool> DeleteScheduleBlockAsync(string id, string userId) =>
        _scheduleService.DeleteDefinitionAsync(id, userId);

    public async Task<List<ScheduleBlockInstanceDto>> GetDayBlocksAsync(string userId, string date)
    {
        var d = DateTime.Parse(date).Date;
        await _materialization.MaterializeForDateAsync(userId, d);
        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Date, d));
        var blocks = await _context.ScheduleBlockInstances.Find(filter)
            .SortBy(sb => sb.StartTime)
            .ToListAsync();
        return blocks.Select(b => new ScheduleBlockInstanceDto
        {
            Id = b.Id,
            Title = b.Title,
            StartTime = b.StartTime,
            EndTime = b.EndTime,
            Date = b.Date,
            Locked = b.Locked,
            DefinitionId = b.DefinitionId,
            RoutineActivities = b.RoutineActivities,
            Source = b.Source,
        }).ToList();
    }

    public async Task<ScheduleBlockInstanceDto> CreateDayOverrideAsync(
        AssistantDayBlockOverrideRequest request,
        string userId)
    {
        var date = DateTime.Parse(request.Date).Date;
        await _materialization.MaterializeForDateAsync(userId, date);

        var instance = new ScheduleBlockInstance
        {
            UserId = userId,
            Date = date,
            DefinitionId = request.DefinitionId ?? string.Empty,
            Title = request.Title.Trim(),
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Locked = request.Locked ?? false,
            Source = "assistant-override",
            RoutineActivities = request.RoutineActivities,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        instance.ChecklistItems = ScheduleChecklistBuilder.BuildForBlock(instance);
        instance.ChecklistVersion = ScheduleChecklistBuilder.CurrentChecklistVersion;
        await _context.ScheduleBlockInstances.InsertOneAsync(instance);
        return (await _scheduleService.GetBlockInstanceByIdAsync(instance.Id, userId))!;
    }

    public async Task<ScheduleBlockInstanceDto> UpdateDayBlockAsync(
        string instanceId,
        AssistantUpdateDayBlockRequest request,
        string userId)
    {
        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(b => b.Id, instanceId),
            Builders<ScheduleBlockInstance>.Filter.Eq(b => b.UserId, userId));
        var existing = await _context.ScheduleBlockInstances.Find(filter).FirstOrDefaultAsync()
            ?? throw new ArgumentException($"Day block '{instanceId}' not found.");

        if (request.Title != null) existing.Title = request.Title.Trim();
        if (request.StartTime != null) existing.StartTime = request.StartTime;
        if (request.EndTime != null) existing.EndTime = request.EndTime;
        if (request.RoutineActivities != null) existing.RoutineActivities = request.RoutineActivities;
        if (request.Locked.HasValue) existing.Locked = request.Locked.Value;
        existing.ChecklistItems = ScheduleChecklistBuilder.RebuildPreservingCompletion(existing, existing.ChecklistItems);
        existing.ChecklistVersion = ScheduleChecklistBuilder.CurrentChecklistVersion;
        existing.UpdatedAt = DateTime.UtcNow;
        await _context.ScheduleBlockInstances.ReplaceOneAsync(filter, existing);
        return (await _scheduleService.GetBlockInstanceByIdAsync(instanceId, userId))!;
    }

    public Task<List<UnifiedRoutineDto>> ListRoutinesAsync(string userId) =>
        _routines.ListAsync(userId);

    public Task<UnifiedRoutineDto> GetRoutineAsync(string userId, string key) =>
        _routines.GetAsync(userId, key);

    public Task<UnifiedRoutineDto> UpsertRoutineAsync(
        string userId,
        string key,
        AssistantRoutineUpsertRequest request) =>
        _routines.UpsertAsync(userId, key, request);

    public Task<UnifiedRoutineDto> ReplaceStepsAsync(
        string userId,
        string key,
        AssistantReplaceStepsRequest request) =>
        _routines.ReplaceStepsAsync(userId, key, request.Shorter, request.Steps);

    public Task<UnifiedRoutineDto> UpsertStepAsync(
        string userId,
        string key,
        RoutineStepDto step,
        bool shorter = false) =>
        _routines.UpsertStepAsync(userId, key, shorter, step);

    public Task<UnifiedRoutineDto> DeleteStepAsync(
        string userId,
        string key,
        string stepId,
        bool shorter = false) =>
        _routines.DeleteStepAsync(userId, key, shorter, stepId);

    public Task<UnifiedRoutineDto> ReorderStepsAsync(
        string userId,
        string key,
        AssistantReorderStepsRequest request) =>
        _routines.ReorderStepsAsync(userId, key, request.Shorter, request.StepIds);

    public Task<UnifiedRoutineDto> UpdateModeSettingsAsync(
        string userId,
        string key,
        AssistantModeSettingsRequest request) =>
        _routines.UpsertAsync(userId, key, new AssistantRoutineUpsertRequest
        {
            TriggerHour = request.TriggerHour,
            TriggerMinute = request.TriggerMinute,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
        });

    public Task<WorkSessionDto?> GetActiveSessionAsync(string userId) =>
        _execution.GetActiveSessionAsync(userId);

    public async Task<WorkSessionDto> CloseSessionAsync(
        string userId,
        string sessionId,
        AssistantCloseSessionRequest request)
    {
        return await _execution.FinishSessionAsync(userId, sessionId, new FinishSessionRequest
        {
            Outcome = string.IsNullOrWhiteSpace(request.Outcome) ? "left" : request.Outcome,
            ReturnPoint = request.ReturnPoint,
            Notes = request.Notes,
        });
    }

    private async Task<ScheduleBlockDefinitionDto?> UpdateDefinitionFieldsAsync(
        string id,
        AssistantScheduleBlockUpsertRequest request,
        string userId)
    {
        var update = new UpdateScheduleBlockDefinitionRequest
        {
            Title = request.Title,
            Kind = request.Kind,
            Recurrence = request.Recurrence,
            DaysOfWeek = request.DaysOfWeek,
            FixedStartTime = request.FixedStartTime,
            FixedEndTime = request.FixedEndTime,
            DurationMinutes = request.DurationMinutes
                ?? (request.FixedStartTime != null || request.FixedEndTime != null
                    ? ComputeDurationMinutes(request.FixedStartTime, request.FixedEndTime)
                    : null),
            PreferredTimeTag = request.PreferredTimeTag,
            Energy = request.Energy,
            Tags = request.Tags,
            Enabled = request.Enabled,
            Priority = request.Priority,
            RoutineActivities = request.RoutineActivities,
        };

        var updated = await _scheduleService.UpdateDefinitionAsync(id, update, userId);
        if (updated != null && request.ShorterRoutineActivities != null)
        {
            var filter = Builders<ScheduleBlockDefinition>.Filter.And(
                Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.Id, id),
                Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.UserId, userId));
            await _context.ScheduleBlockDefinitions.UpdateOneAsync(
                filter,
                Builders<ScheduleBlockDefinition>.Update
                    .Set(d => d.ShorterRoutineActivities, request.ShorterRoutineActivities)
                    .Set(d => d.UpdatedAt, DateTime.UtcNow));
            updated = await _scheduleService.GetDefinitionByIdAsync(id, userId);
        }

        return updated;
    }

    private static int? ComputeDurationMinutes(string? start, string? end)
    {
        if (string.IsNullOrWhiteSpace(start) || string.IsNullOrWhiteSpace(end))
            return null;
        return ScheduleChecklistBuilder.GetBlockDurationMinutes(start, end);
    }

    private static (string BlockId, DisciplineItemDto Item)? FindItem(
        DisciplineEntryDto entry,
        string? blockId,
        string? itemId,
        string? itemName)
    {
        var blocks = entry.Blocks ?? new List<DisciplineBlockDto>();
        if (!string.IsNullOrWhiteSpace(blockId))
        {
            blocks = blocks
                .Where(b => string.Equals(b.BlockId, blockId, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        foreach (var block in blocks)
        {
            foreach (var item in block.Items ?? new List<DisciplineItemDto>())
            {
                if (!string.IsNullOrWhiteSpace(itemId)
                    && string.Equals(item.ItemId, itemId, StringComparison.OrdinalIgnoreCase))
                    return (block.BlockId, item);

                if (!string.IsNullOrWhiteSpace(itemName)
                    && (item.ItemName?.Contains(itemName.Trim(), StringComparison.OrdinalIgnoreCase) ?? false))
                    return (block.BlockId, item);
            }
        }

        return null;
    }
}
