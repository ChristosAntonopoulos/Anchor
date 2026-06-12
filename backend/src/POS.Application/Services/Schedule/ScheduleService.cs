using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Schedule;
using POS.Core.Entities.Schedule;
using POS.Core.Exceptions;
using POS.Core.Schedule;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Schedule;

/// <summary>
/// Service for managing schedule blocks
/// </summary>
public class ScheduleService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ScheduleService> _logger;

    public ScheduleService(MongoDbContext context, IMapper mapper, ILogger<ScheduleService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get all schedule blocks for today
    /// </summary>
    public async Task<List<ScheduleBlockInstanceDto>> GetTodayScheduleAsync(string userId)
    {
        _logger.LogInformation("Getting today's schedule for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Date, today)
        );
        
        var blocks = await _context.ScheduleBlockInstances.Find(filter)
            .SortBy(sb => sb.StartTime)
            .ToListAsync();

        foreach (var block in blocks)
            await EnsureChecklistItemsAsync(block);

        return _mapper.Map<List<ScheduleBlockInstanceDto>>(blocks);
    }

    /// <summary>
    /// Toggle completion on a checklist item for today's block instance.
    /// </summary>
    public async Task<ScheduleBlockInstanceDto> UpdateChecklistItemAsync(
        string blockId,
        string itemId,
        UpdateScheduleChecklistItemRequest request,
        string userId)
    {
        var block = await GetBlockEntityAsync(blockId, userId);
        await EnsureChecklistItemsAsync(block);

        var item = block.ChecklistItems?.FirstOrDefault(i => i.Id == itemId)
            ?? throw new NotFoundException("ScheduleChecklistItem", itemId);

        item.Completed = request.Completed;
        block.UpdatedAt = DateTime.UtcNow;

        await SaveBlockAsync(block);
        return _mapper.Map<ScheduleBlockInstanceDto>(block);
    }

    private async Task<ScheduleBlockInstance> GetBlockEntityAsync(string blockId, string userId)
    {
        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Id, blockId),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId));

        return await _context.ScheduleBlockInstances.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("ScheduleBlock", blockId);
    }

    private async Task EnsureChecklistItemsAsync(ScheduleBlockInstance block)
    {
        var needsBuild = block.ChecklistItems is not { Count: > 0 };
        var needsUpgrade = block.ChecklistVersion < ScheduleChecklistBuilder.CurrentChecklistVersion
            || (block.ChecklistItems is { Count: > 0 } checkItems
                && ScheduleChecklistBuilder.LooksLikeLegacyEqualSplit(checkItems));

        if (!needsBuild && !needsUpgrade)
            return;

        block.ChecklistItems = ScheduleChecklistBuilder.RebuildPreservingCompletion(
            block,
            block.ChecklistItems);
        block.ChecklistVersion = ScheduleChecklistBuilder.CurrentChecklistVersion;
        block.UpdatedAt = DateTime.UtcNow;
        await SaveBlockAsync(block);
        _logger.LogInformation(
            "Generated {Count} checklist items for schedule block {BlockId} (v{Version})",
            block.ChecklistItems.Count, block.Id, block.ChecklistVersion);
    }

    private async Task SaveBlockAsync(ScheduleBlockInstance block)
    {
        var filter = Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Id, block.Id);
        await _context.ScheduleBlockInstances.ReplaceOneAsync(filter, block);
    }

    /// <summary>
    /// Create a schedule block definition
    /// </summary>
    public async Task<ScheduleBlockDefinitionDto> CreateDefinitionAsync(CreateScheduleBlockDefinitionDto dto, string userId)
    {
        _logger.LogInformation("Creating schedule block definition for user {UserId}", userId);
        
        var definition = _mapper.Map<ScheduleBlockDefinition>(dto);
        definition.UserId = userId;
        
        await _context.ScheduleBlockDefinitions.InsertOneAsync(definition);
        return _mapper.Map<ScheduleBlockDefinitionDto>(definition);
    }

    /// <summary>
    /// Update a schedule block instance
    /// </summary>
    public async Task<ScheduleBlockInstanceDto> UpdateBlockAsync(UpdateScheduleBlockRequest request, string userId)
    {
        _logger.LogInformation("Updating schedule block {BlockId} for user {UserId}", request.Id, userId);
        
        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Id, request.Id),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId)
        );
        
        var block = await _context.ScheduleBlockInstances.Find(filter).FirstOrDefaultAsync();
        if (block == null)
        {
            throw new NotFoundException("ScheduleBlock", request.Id);
        }

        if (!string.IsNullOrEmpty(request.Title))
            block.Title = request.Title;
        if (!string.IsNullOrEmpty(request.StartTime))
            block.StartTime = request.StartTime;
        if (!string.IsNullOrEmpty(request.EndTime))
            block.EndTime = request.EndTime;

        block.UpdatedAt = DateTime.UtcNow;
        await _context.ScheduleBlockInstances.ReplaceOneAsync(filter, block);
        
        return _mapper.Map<ScheduleBlockInstanceDto>(block);
    }

    /// <summary>
    /// Delete a schedule block instance
    /// </summary>
    public async Task<bool> DeleteBlockAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting schedule block {BlockId} for user {UserId}", id, userId);
        
        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Id, id),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId)
        );
        
        var result = await _context.ScheduleBlockInstances.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }

    /// <summary>
    /// Get schedule block instance by ID
    /// </summary>
    public async Task<ScheduleBlockInstanceDto?> GetBlockInstanceByIdAsync(string id, string userId)
    {
        _logger.LogInformation("Getting schedule block instance {BlockId} for user {UserId}", id, userId);
        
        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Id, id),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId)
        );
        
        var block = await _context.ScheduleBlockInstances.Find(filter).FirstOrDefaultAsync();
        return block != null ? _mapper.Map<ScheduleBlockInstanceDto>(block) : null;
    }

    /// <summary>
    /// Get all schedule block definitions
    /// </summary>
    public async Task<List<ScheduleBlockDefinitionDto>> GetAllDefinitionsAsync(string userId)
    {
        _logger.LogInformation("Getting all schedule block definitions for user {UserId}", userId);
        
        var filter = Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.UserId, userId);
        var sort = Builders<ScheduleBlockDefinition>.Sort.Ascending(d => d.Priority).Ascending(d => d.Title);
        
        var definitions = await _context.ScheduleBlockDefinitions
            .Find(filter)
            .Sort(sort)
            .ToListAsync();
        
        return _mapper.Map<List<ScheduleBlockDefinitionDto>>(definitions);
    }

    /// <summary>
    /// Get schedule block definition by ID
    /// </summary>
    public async Task<ScheduleBlockDefinitionDto?> GetDefinitionByIdAsync(string id, string userId)
    {
        _logger.LogInformation("Getting schedule block definition {DefinitionId} for user {UserId}", id, userId);
        
        var filter = Builders<ScheduleBlockDefinition>.Filter.And(
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.Id, id),
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.UserId, userId)
        );
        
        var definition = await _context.ScheduleBlockDefinitions.Find(filter).FirstOrDefaultAsync();
        return definition != null ? _mapper.Map<ScheduleBlockDefinitionDto>(definition) : null;
    }

    /// <summary>
    /// Update schedule block definition
    /// </summary>
    public async Task<ScheduleBlockDefinitionDto?> UpdateDefinitionAsync(string id, UpdateScheduleBlockDefinitionRequest request, string userId)
    {
        _logger.LogInformation("Updating schedule block definition {DefinitionId} for user {UserId}", id, userId);
        
        var filter = Builders<ScheduleBlockDefinition>.Filter.And(
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.Id, id),
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.UserId, userId)
        );
        
        var existing = await _context.ScheduleBlockDefinitions.Find(filter).FirstOrDefaultAsync();
        if (existing == null)
        {
            return null;
        }
        
        var updateBuilder = Builders<ScheduleBlockDefinition>.Update
            .Set(d => d.UpdatedAt, DateTime.UtcNow);
        
        if (request.Title != null) updateBuilder = updateBuilder.Set(d => d.Title, request.Title);
        if (request.Kind != null) updateBuilder = updateBuilder.Set(d => d.Kind, Enum.Parse<ScheduleBlockKind>(request.Kind, true));
        if (request.Recurrence != null) updateBuilder = updateBuilder.Set(d => d.Recurrence, Enum.Parse<RecurrenceType>(request.Recurrence, true));
        if (request.DaysOfWeek != null) updateBuilder = updateBuilder.Set(d => d.DaysOfWeek, request.DaysOfWeek);
        if (request.MinPerWeek.HasValue) updateBuilder = updateBuilder.Set(d => d.MinPerWeek, request.MinPerWeek.Value);
        if (request.MaxPerWeek.HasValue) updateBuilder = updateBuilder.Set(d => d.MaxPerWeek, request.MaxPerWeek.Value);
        if (request.FixedStartTime != null) updateBuilder = updateBuilder.Set(d => d.FixedStartTime, request.FixedStartTime);
        if (request.FixedEndTime != null) updateBuilder = updateBuilder.Set(d => d.FixedEndTime, request.FixedEndTime);
        if (request.PreferredTimeTag != null) updateBuilder = updateBuilder.Set(d => d.PreferredTimeTag, request.PreferredTimeTag);
        if (request.DurationMinutes.HasValue) updateBuilder = updateBuilder.Set(d => d.DurationMinutes, request.DurationMinutes.Value);
        if (request.Energy != null) updateBuilder = updateBuilder.Set(d => d.Energy, Enum.Parse<EnergyLevel>(request.Energy, true));
        if (request.Tags != null) updateBuilder = updateBuilder.Set(d => d.Tags, request.Tags);
        if (request.Enabled.HasValue) updateBuilder = updateBuilder.Set(d => d.Enabled, request.Enabled.Value);
        if (request.Priority.HasValue) updateBuilder = updateBuilder.Set(d => d.Priority, request.Priority.Value);
        if (request.RoutineActivities != null) updateBuilder = updateBuilder.Set(d => d.RoutineActivities, request.RoutineActivities);
        
        await _context.ScheduleBlockDefinitions.UpdateOneAsync(filter, updateBuilder);
        
        var updated = await _context.ScheduleBlockDefinitions.Find(filter).FirstOrDefaultAsync();
        return updated != null ? _mapper.Map<ScheduleBlockDefinitionDto>(updated) : null;
    }

    /// <summary>
    /// Delete schedule block definition
    /// </summary>
    public async Task<bool> DeleteDefinitionAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting schedule block definition {DefinitionId} for user {UserId}", id, userId);
        
        var filter = Builders<ScheduleBlockDefinition>.Filter.And(
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.Id, id),
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.UserId, userId)
        );
        
        var result = await _context.ScheduleBlockDefinitions.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }
}
