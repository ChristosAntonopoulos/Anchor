using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Discipline;
using POS.Core.Entities.Discipline;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Discipline;

/// <summary>
/// Service for managing discipline entries
/// </summary>
public class DisciplineService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DisciplineService> _logger;

    public DisciplineService(MongoDbContext context, IMapper mapper, ILogger<DisciplineService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get today's discipline entry
    /// </summary>
    public async Task<DisciplineEntryDto> GetTodayDisciplineAsync(string userId)
    {
        _logger.LogInformation("Getting today's discipline entry for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, today)
        );
        
        var discipline = await _context.DisciplineEntries.Find(filter).FirstOrDefaultAsync();
        
        if (discipline == null)
        {
            // Create default discipline entry
            discipline = new DisciplineEntry
            {
                UserId = userId,
                Date = today
            };
            await _context.DisciplineEntries.InsertOneAsync(discipline);
        }
        
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    /// <summary>
    /// Update today's discipline entry
    /// </summary>
    public async Task<DisciplineEntryDto> UpdateDisciplineAsync(UpdateDisciplineRequest request, string userId)
    {
        _logger.LogInformation("Updating discipline entry for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, today)
        );
        
        var discipline = await _context.DisciplineEntries.Find(filter).FirstOrDefaultAsync();
        
        if (discipline == null)
        {
            discipline = new DisciplineEntry
            {
                UserId = userId,
                Date = today
            };
        }

        // Update only provided fields
        if (request.Gym.HasValue)
            discipline.Gym = request.Gym.Value;
        if (request.Walk.HasValue)
            discipline.Walk = request.Walk.Value;
        if (request.Cooked.HasValue)
            discipline.Cooked = request.Cooked.Value;
        if (request.Diet.HasValue)
            discipline.Diet = request.Diet.Value;
        if (request.Meditation.HasValue)
            discipline.Meditation = request.Meditation.Value;
        if (request.Water.HasValue)
            discipline.Water = request.Water.Value;
        if (request.Note != null)
            discipline.Note = request.Note;

        discipline.UpdatedAt = DateTime.UtcNow;
        
        if (string.IsNullOrEmpty(discipline.Id))
        {
            await _context.DisciplineEntries.InsertOneAsync(discipline);
        }
        else
        {
            await _context.DisciplineEntries.ReplaceOneAsync(filter, discipline);
        }
        
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }
}
