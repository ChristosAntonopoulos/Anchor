using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.CBT;
using POS.Core.Entities.CBT;
using POS.Infrastructure.Data;

namespace POS.Application.Services.CBT;

/// <summary>
/// Service for managing CBT entries, mood tracking, and behavioral activities
/// </summary>
public class CBTService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CBTService> _logger;

    public CBTService(MongoDbContext context, IMapper mapper, ILogger<CBTService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Submit CBT text input for AI processing
    /// </summary>
    public async Task<CBTEntryDto> SubmitCBTEntryAsync(CreateCBTEntryRequest request, string userId)
    {
        _logger.LogInformation("Submitting CBT entry for user {UserId}", userId);

        if (string.IsNullOrWhiteSpace(request.Text))
        {
            throw new ArgumentException("Text cannot be empty", nameof(request));
        }

        var entry = new CBTEntry
        {
            Text = request.Text.Trim(),
            Status = "pending",
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.CBTEntries.InsertOneAsync(entry);

        _logger.LogInformation("CBT entry {EntryId} submitted successfully", entry.Id);

        return _mapper.Map<CBTEntryDto>(entry);
    }

    /// <summary>
    /// Get CBT entries for user (optionally filtered by date)
    /// </summary>
    public async Task<List<CBTEntryDto>> GetCBTEntriesAsync(string userId, DateTime? date = null)
    {
        _logger.LogInformation("Getting CBT entries for user {UserId}", userId);

        var filterBuilder = Builders<CBTEntry>.Filter;
        var filter = filterBuilder.Eq(e => e.UserId, userId);

        if (date.HasValue)
        {
            var dateStart = date.Value.Date;
            var dateEnd = dateStart.AddDays(1);
            filter = filterBuilder.And(
                filter,
                filterBuilder.Gte(e => e.CreatedAt, dateStart),
                filterBuilder.Lt(e => e.CreatedAt, dateEnd)
            );
        }

        var sort = Builders<CBTEntry>.Sort.Descending(e => e.CreatedAt);

        var entries = await _context.CBTEntries
            .Find(filter)
            .Sort(sort)
            .ToListAsync();

        return _mapper.Map<List<CBTEntryDto>>(entries);
    }

    /// <summary>
    /// Get single CBT entry by ID
    /// </summary>
    public async Task<CBTEntryDto?> GetCBTEntryByIdAsync(string id, string userId)
    {
        _logger.LogInformation("Getting CBT entry {EntryId} for user {UserId}", id, userId);

        var entry = await _context.CBTEntries
            .Find(e => e.Id == id && e.UserId == userId)
            .FirstOrDefaultAsync();

        return entry != null ? _mapper.Map<CBTEntryDto>(entry) : null;
    }

    /// <summary>
    /// Update CBT entry (for manual edits)
    /// </summary>
    public async Task<CBTEntryDto?> UpdateCBTEntryAsync(string id, UpdateCBTEntryRequest request, string userId)
    {
        _logger.LogInformation("Updating CBT entry {EntryId} for user {UserId}", id, userId);

        var filter = Builders<CBTEntry>.Filter.Eq(e => e.Id, id) & Builders<CBTEntry>.Filter.Eq(e => e.UserId, userId);
        var existingEntry = await _context.CBTEntries.Find(filter).FirstOrDefaultAsync();

        if (existingEntry == null)
        {
            return null;
        }

        var updateBuilder = Builders<CBTEntry>.Update
            .Set(e => e.UpdatedAt, DateTime.UtcNow);

        if (request.Situation != null) updateBuilder = updateBuilder.Set(e => e.Situation, request.Situation);
        if (request.AutomaticThoughts != null) updateBuilder = updateBuilder.Set(e => e.AutomaticThoughts, _mapper.Map<List<AutomaticThought>>(request.AutomaticThoughts));
        if (request.EvidenceFor != null) updateBuilder = updateBuilder.Set(e => e.EvidenceFor, request.EvidenceFor);
        if (request.EvidenceAgainst != null) updateBuilder = updateBuilder.Set(e => e.EvidenceAgainst, request.EvidenceAgainst);
        if (request.AlternativeThoughts != null) updateBuilder = updateBuilder.Set(e => e.AlternativeThoughts, request.AlternativeThoughts);
        if (request.Outcome != null) updateBuilder = updateBuilder.Set(e => e.Outcome, request.Outcome);

        await _context.CBTEntries.UpdateOneAsync(filter, updateBuilder);

        var updatedEntry = await _context.CBTEntries.Find(filter).FirstOrDefaultAsync();
        return updatedEntry != null ? _mapper.Map<CBTEntryDto>(updatedEntry) : null;
    }

    /// <summary>
    /// Delete CBT entry
    /// </summary>
    public async Task<bool> DeleteCBTEntryAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting CBT entry {EntryId} for user {UserId}", id, userId);

        var filter = Builders<CBTEntry>.Filter.Eq(e => e.Id, id) & Builders<CBTEntry>.Filter.Eq(e => e.UserId, userId);
        var result = await _context.CBTEntries.DeleteOneAsync(filter);

        return result.DeletedCount > 0;
    }

    /// <summary>
    /// Get mood entries for date range
    /// </summary>
    public async Task<List<MoodEntryDto>> GetMoodEntriesAsync(string userId, DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("Getting mood entries for user {UserId} from {StartDate} to {EndDate}", userId, startDate, endDate);

        var filter = Builders<MoodEntry>.Filter.And(
            Builders<MoodEntry>.Filter.Eq(e => e.UserId, userId),
            Builders<MoodEntry>.Filter.Gte(e => e.Date, startDate.Date),
            Builders<MoodEntry>.Filter.Lte(e => e.Date, endDate.Date)
        );

        var sort = Builders<MoodEntry>.Sort.Ascending(e => e.Date);

        var entries = await _context.MoodEntries
            .Find(filter)
            .Sort(sort)
            .ToListAsync();

        return _mapper.Map<List<MoodEntryDto>>(entries);
    }

    /// <summary>
    /// Create mood entry
    /// </summary>
    public async Task<MoodEntryDto> CreateMoodEntryAsync(CreateMoodEntryRequest request, string userId)
    {
        _logger.LogInformation("Creating mood entry for user {UserId}", userId);

        var entry = _mapper.Map<MoodEntry>(request);
        entry.UserId = userId;
        entry.CreatedAt = DateTime.UtcNow;
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.MoodEntries.InsertOneAsync(entry);

        return _mapper.Map<MoodEntryDto>(entry);
    }

    /// <summary>
    /// Get behavioral activities (optionally filtered by date)
    /// </summary>
    public async Task<List<BehavioralActivityDto>> GetBehavioralActivitiesAsync(string userId, DateTime? date = null)
    {
        _logger.LogInformation("Getting behavioral activities for user {UserId}", userId);

        var filterBuilder = Builders<BehavioralActivity>.Filter;
        var filter = filterBuilder.Eq(a => a.UserId, userId);

        if (date.HasValue)
        {
            var dateStart = date.Value.Date;
            var dateEnd = dateStart.AddDays(1);
            filter = filterBuilder.And(
                filter,
                filterBuilder.Or(
                    filterBuilder.And(
                        filterBuilder.Eq(a => a.ScheduledDate, dateStart),
                        filterBuilder.Exists(a => a.ScheduledDate, true)
                    ),
                    filterBuilder.And(
                        filterBuilder.Gte(a => a.CreatedAt, dateStart),
                        filterBuilder.Lt(a => a.CreatedAt, dateEnd)
                    )
                )
            );
        }

        var sort = Builders<BehavioralActivity>.Sort.Descending(a => a.CreatedAt);

        var activities = await _context.BehavioralActivities
            .Find(filter)
            .Sort(sort)
            .ToListAsync();

        return _mapper.Map<List<BehavioralActivityDto>>(activities);
    }

    /// <summary>
    /// Create behavioral activity
    /// </summary>
    public async Task<BehavioralActivityDto> CreateBehavioralActivityAsync(CreateBehavioralActivityRequest request, string userId)
    {
        _logger.LogInformation("Creating behavioral activity for user {UserId}", userId);

        var activity = _mapper.Map<BehavioralActivity>(request);
        activity.UserId = userId;
        activity.IsCompleted = false;
        activity.CreatedAt = DateTime.UtcNow;
        activity.UpdatedAt = DateTime.UtcNow;

        await _context.BehavioralActivities.InsertOneAsync(activity);

        return _mapper.Map<BehavioralActivityDto>(activity);
    }

    /// <summary>
    /// Update behavioral activity
    /// </summary>
    public async Task<BehavioralActivityDto?> UpdateBehavioralActivityAsync(string id, UpdateBehavioralActivityRequest request, string userId)
    {
        _logger.LogInformation("Updating behavioral activity {ActivityId} for user {UserId}", id, userId);

        var filter = Builders<BehavioralActivity>.Filter.Eq(a => a.Id, id) & Builders<BehavioralActivity>.Filter.Eq(a => a.UserId, userId);
        var existingActivity = await _context.BehavioralActivities.Find(filter).FirstOrDefaultAsync();

        if (existingActivity == null)
        {
            return null;
        }

        var updateBuilder = Builders<BehavioralActivity>.Update
            .Set(a => a.UpdatedAt, DateTime.UtcNow);

        if (request.Title != null) updateBuilder = updateBuilder.Set(a => a.Title, request.Title);
        if (request.Description != null) updateBuilder = updateBuilder.Set(a => a.Description, request.Description);
        if (request.ScheduledDate.HasValue) updateBuilder = updateBuilder.Set(a => a.ScheduledDate, request.ScheduledDate.Value);
        if (request.Notes != null) updateBuilder = updateBuilder.Set(a => a.Notes, request.Notes);

        await _context.BehavioralActivities.UpdateOneAsync(filter, updateBuilder);

        var updatedActivity = await _context.BehavioralActivities.Find(filter).FirstOrDefaultAsync();
        return updatedActivity != null ? _mapper.Map<BehavioralActivityDto>(updatedActivity) : null;
    }

    /// <summary>
    /// Complete behavioral activity with ratings
    /// </summary>
    public async Task<BehavioralActivityDto?> CompleteBehavioralActivityAsync(string id, CompleteBehavioralActivityRequest request, string userId)
    {
        _logger.LogInformation("Completing behavioral activity {ActivityId} for user {UserId}", id, userId);

        var filter = Builders<BehavioralActivity>.Filter.Eq(a => a.Id, id) & Builders<BehavioralActivity>.Filter.Eq(a => a.UserId, userId);
        var update = Builders<BehavioralActivity>.Update
            .Set(a => a.IsCompleted, true)
            .Set(a => a.CompletedDate, DateTime.UtcNow)
            .Set(a => a.UpdatedAt, DateTime.UtcNow);

        if (request.MoodBefore.HasValue) update = update.Set(a => a.MoodBefore, request.MoodBefore.Value);
        if (request.MoodAfter.HasValue) update = update.Set(a => a.MoodAfter, request.MoodAfter.Value);
        if (request.PleasureRating.HasValue) update = update.Set(a => a.PleasureRating, request.PleasureRating.Value);
        if (request.MasteryRating.HasValue) update = update.Set(a => a.MasteryRating, request.MasteryRating.Value);
        if (request.Notes != null) update = update.Set(a => a.Notes, request.Notes);

        await _context.BehavioralActivities.UpdateOneAsync(filter, update);

        var completedActivity = await _context.BehavioralActivities.Find(filter).FirstOrDefaultAsync();
        return completedActivity != null ? _mapper.Map<BehavioralActivityDto>(completedActivity) : null;
    }
}
