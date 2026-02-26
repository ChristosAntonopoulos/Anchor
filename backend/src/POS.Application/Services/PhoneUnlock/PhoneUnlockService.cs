using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.PhoneUnlock;
using POS.Core.Entities;
using POS.Infrastructure.Data;

namespace POS.Application.Services.PhoneUnlock;

/// <summary>
/// Service for managing phone unlock entries
/// </summary>
public class PhoneUnlockService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<PhoneUnlockService> _logger;

    public PhoneUnlockService(MongoDbContext context, IMapper mapper, ILogger<PhoneUnlockService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Create phone unlock entry
    /// </summary>
    public async Task<PhoneUnlockEntryDto> CreatePhoneUnlockEntryAsync(CreatePhoneUnlockEntryRequest request, string userId)
    {
        _logger.LogInformation("Creating phone unlock entry for user {UserId}", userId);

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ArgumentException("Reason cannot be empty", nameof(request));
        }

        var entry = new PhoneUnlockEntry
        {
            Reason = request.Reason.Trim(),
            UnlockedAt = request.UnlockedAt ?? DateTime.UtcNow,
            UnlockMethod = request.UnlockMethod,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.PhoneUnlockEntries.InsertOneAsync(entry);

        _logger.LogInformation("Phone unlock entry {EntryId} created successfully", entry.Id);

        return _mapper.Map<PhoneUnlockEntryDto>(entry);
    }

    /// <summary>
    /// Get phone unlock entries for user (optionally filtered by date range)
    /// </summary>
    public async Task<List<PhoneUnlockEntryDto>> GetPhoneUnlockEntriesAsync(string userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        _logger.LogInformation("Getting phone unlock entries for user {UserId}", userId);

        var filterBuilder = Builders<PhoneUnlockEntry>.Filter;
        var filter = filterBuilder.Eq(e => e.UserId, userId);

        if (startDate.HasValue || endDate.HasValue)
        {
            if (startDate.HasValue && endDate.HasValue)
            {
                filter = filterBuilder.And(
                    filter,
                    filterBuilder.Gte(e => e.UnlockedAt, startDate.Value),
                    filterBuilder.Lte(e => e.UnlockedAt, endDate.Value)
                );
            }
            else if (startDate.HasValue)
            {
                filter = filterBuilder.And(
                    filter,
                    filterBuilder.Gte(e => e.UnlockedAt, startDate.Value)
                );
            }
            else if (endDate.HasValue)
            {
                filter = filterBuilder.And(
                    filter,
                    filterBuilder.Lte(e => e.UnlockedAt, endDate.Value)
                );
            }
        }

        var sort = Builders<PhoneUnlockEntry>.Sort.Descending(e => e.UnlockedAt);

        var entries = await _context.PhoneUnlockEntries
            .Find(filter)
            .Sort(sort)
            .ToListAsync();

        return _mapper.Map<List<PhoneUnlockEntryDto>>(entries);
    }
}
