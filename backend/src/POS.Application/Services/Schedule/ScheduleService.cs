using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Schedule;
using POS.Core.Entities.Schedule;
using POS.Core.Exceptions;
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
        
        return _mapper.Map<List<ScheduleBlockInstanceDto>>(blocks);
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
}
