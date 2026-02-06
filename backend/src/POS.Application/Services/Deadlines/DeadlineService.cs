using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Deadlines;
using POS.Core.Entities.Deadlines;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Deadlines;

/// <summary>
/// Service for managing deadlines
/// </summary>
public class DeadlineService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DeadlineService> _logger;

    public DeadlineService(MongoDbContext context, IMapper mapper, ILogger<DeadlineService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get all active deadlines
    /// </summary>
    public async Task<List<DeadlineDto>> GetAllDeadlinesAsync(string userId)
    {
        _logger.LogInformation("Getting all deadlines for user {UserId}", userId);
        
        var filter = Builders<Deadline>.Filter.And(
            Builders<Deadline>.Filter.Eq(d => d.UserId, userId),
            Builders<Deadline>.Filter.Ne(d => d.Status, DeadlineStatus.Completed)
        );
        
        var deadlines = await _context.Deadlines
            .Find(filter)
            .SortBy(d => d.DueDate)
            .ToListAsync();
        
        var today = DateTime.UtcNow.Date;
        var deadlineDtos = _mapper.Map<List<DeadlineDto>>(deadlines);
        
        // Calculate days left for each deadline
        foreach (var dto in deadlineDtos)
        {
            if (DateTime.TryParse(dto.DueDate, out var dueDate))
            {
                dto.DaysLeft = (dueDate.Date - today).Days;
            }
        }
        
        return deadlineDtos;
    }

    /// <summary>
    /// Create a deadline
    /// </summary>
    public async Task<DeadlineDto> CreateDeadlineAsync(CreateDeadlineRequest request, string userId)
    {
        _logger.LogInformation("Creating deadline for user {UserId}", userId);
        
        var dueDate = DateTime.Parse(request.DueDate);
        var deadline = new Deadline
        {
            UserId = userId,
            Title = request.Title,
            DueDate = dueDate,
            Importance = request.Importance,
            Status = DeadlineStatus.OnTrack
        };
        
        await _context.Deadlines.InsertOneAsync(deadline);
        
        var dto = _mapper.Map<DeadlineDto>(deadline);
        var today = DateTime.UtcNow.Date;
        dto.DaysLeft = (dueDate.Date - today).Days;
        
        return dto;
    }

    /// <summary>
    /// Update a deadline
    /// </summary>
    public async Task<DeadlineDto> UpdateDeadlineAsync(UpdateDeadlineRequest request, string userId)
    {
        _logger.LogInformation("Updating deadline {DeadlineId} for user {UserId}", request.Id, userId);
        
        var filter = Builders<Deadline>.Filter.And(
            Builders<Deadline>.Filter.Eq(d => d.Id, request.Id),
            Builders<Deadline>.Filter.Eq(d => d.UserId, userId)
        );
        
        var deadline = await _context.Deadlines.Find(filter).FirstOrDefaultAsync();
        if (deadline == null)
        {
            throw new NotFoundException("Deadline", request.Id);
        }

        if (!string.IsNullOrEmpty(request.Title))
            deadline.Title = request.Title;
        if (!string.IsNullOrEmpty(request.DueDate))
            deadline.DueDate = DateTime.Parse(request.DueDate);
        if (!string.IsNullOrEmpty(request.Status))
        {
            deadline.Status = request.Status switch
            {
                "on track" => DeadlineStatus.OnTrack,
                "behind" => DeadlineStatus.Behind,
                "completed" => DeadlineStatus.Completed,
                _ => deadline.Status
            };
        }
        if (request.Importance.HasValue)
            deadline.Importance = request.Importance.Value;

        deadline.UpdatedAt = DateTime.UtcNow;
        await _context.Deadlines.ReplaceOneAsync(filter, deadline);
        
        var dto = _mapper.Map<DeadlineDto>(deadline);
        var today = DateTime.UtcNow.Date;
        dto.DaysLeft = (deadline.DueDate.Date - today).Days;
        
        return dto;
    }

    /// <summary>
    /// Delete a deadline
    /// </summary>
    public async Task<bool> DeleteDeadlineAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting deadline {DeadlineId} for user {UserId}", id, userId);
        
        var filter = Builders<Deadline>.Filter.And(
            Builders<Deadline>.Filter.Eq(d => d.Id, id),
            Builders<Deadline>.Filter.Eq(d => d.UserId, userId)
        );
        
        var result = await _context.Deadlines.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }
}
