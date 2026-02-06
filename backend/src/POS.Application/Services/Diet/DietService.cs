using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Diet;
using POS.Core.Entities.Diet;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Diet;

/// <summary>
/// Service for managing diet entries
/// </summary>
public class DietService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DietService> _logger;

    public DietService(MongoDbContext context, IMapper mapper, ILogger<DietService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get today's diet entry
    /// </summary>
    public async Task<DietEntryDto> GetTodayDietAsync(string userId)
    {
        _logger.LogInformation("Getting today's diet entry for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<DietEntry>.Filter.And(
            Builders<DietEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DietEntry>.Filter.Eq(d => d.Date, today)
        );
        
        var diet = await _context.DietEntries.Find(filter).FirstOrDefaultAsync();
        
        if (diet == null)
        {
            // Create default diet entry
            diet = new DietEntry
            {
                UserId = userId,
                Date = today
            };
            await _context.DietEntries.InsertOneAsync(diet);
        }
        
        return _mapper.Map<DietEntryDto>(diet);
    }

    /// <summary>
    /// Update today's diet entry
    /// </summary>
    public async Task<DietEntryDto> UpdateDietAsync(UpdateDietRequest request, string userId)
    {
        _logger.LogInformation("Updating diet entry for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<DietEntry>.Filter.And(
            Builders<DietEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DietEntry>.Filter.Eq(d => d.Date, today)
        );
        
        var diet = await _context.DietEntries.Find(filter).FirstOrDefaultAsync();
        
        if (diet == null)
        {
            diet = new DietEntry
            {
                UserId = userId,
                Date = today
            };
        }

        // Update only provided fields
        if (request.Compliant.HasValue)
            diet.Compliant = request.Compliant.Value;
        if (request.PhotoUri != null)
            diet.PhotoUrl = request.PhotoUri;
        if (request.Note != null)
            diet.Note = request.Note;

        diet.UpdatedAt = DateTime.UtcNow;
        
        if (string.IsNullOrEmpty(diet.Id))
        {
            await _context.DietEntries.InsertOneAsync(diet);
        }
        else
        {
            await _context.DietEntries.ReplaceOneAsync(filter, diet);
        }
        
        return _mapper.Map<DietEntryDto>(diet);
    }
}
