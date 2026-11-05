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

    /// <summary>
    /// Create diet entry
    /// </summary>
    public async Task<DietEntryDto> CreateDietAsync(CreateDietRequest request, string userId)
    {
        _logger.LogInformation("Creating diet entry for user {UserId}", userId);
        
        var date = DateTime.Parse(request.Date).Date;
        
        var filter = Builders<DietEntry>.Filter.And(
            Builders<DietEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DietEntry>.Filter.Eq(d => d.Date, date)
        );
        
        var existing = await _context.DietEntries.Find(filter).FirstOrDefaultAsync();
        if (existing != null)
        {
            throw new ArgumentException($"Diet entry already exists for date {request.Date}");
        }
        
        var diet = new DietEntry
        {
            UserId = userId,
            Date = date,
            Compliant = request.Compliant ?? false,
            PhotoUrl = request.PhotoUri,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        await _context.DietEntries.InsertOneAsync(diet);
        return _mapper.Map<DietEntryDto>(diet);
    }

    /// <summary>
    /// Get diet entry by date
    /// </summary>
    public async Task<DietEntryDto?> GetDietByDateAsync(string userId, DateTime date)
    {
        _logger.LogInformation("Getting diet entry for date {Date} for user {UserId}", date, userId);
        
        var filter = Builders<DietEntry>.Filter.And(
            Builders<DietEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DietEntry>.Filter.Eq(d => d.Date, date.Date)
        );
        
        var diet = await _context.DietEntries.Find(filter).FirstOrDefaultAsync();
        return diet != null ? _mapper.Map<DietEntryDto>(diet) : null;
    }

    /// <summary>
    /// Get diet entries by date range
    /// </summary>
    public async Task<List<DietEntryDto>> GetDietByDateRangeAsync(string userId, DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("Getting diet entries from {StartDate} to {EndDate} for user {UserId}", startDate, endDate, userId);
        
        var filter = Builders<DietEntry>.Filter.And(
            Builders<DietEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DietEntry>.Filter.Gte(d => d.Date, startDate.Date),
            Builders<DietEntry>.Filter.Lte(d => d.Date, endDate.Date)
        );
        
        var sort = Builders<DietEntry>.Sort.Descending(d => d.Date);
        
        var entries = await _context.DietEntries
            .Find(filter)
            .Sort(sort)
            .ToListAsync();
        
        return _mapper.Map<List<DietEntryDto>>(entries);
    }

    /// <summary>
    /// Delete diet entry by date
    /// </summary>
    public async Task<bool> DeleteDietAsync(string userId, DateTime date)
    {
        _logger.LogInformation("Deleting diet entry for date {Date} for user {UserId}", date, userId);
        
        var filter = Builders<DietEntry>.Filter.And(
            Builders<DietEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DietEntry>.Filter.Eq(d => d.Date, date.Date)
        );
        
        var result = await _context.DietEntries.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }
}
