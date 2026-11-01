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
    private const int CurrentSchemaVersion = 2;
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
    /// Create or upsert a phone unlock entry. PromptId is used for idempotent updates.
    /// </summary>
    public async Task<PhoneUnlockEntryDto> CreatePhoneUnlockEntryAsync(CreatePhoneUnlockEntryRequest request, string userId)
    {
        var schemaVersion = request.SchemaVersion > 0 ? request.SchemaVersion : CurrentSchemaVersion;
        _logger.LogInformation(
            "Saving phone unlock entry for user {UserId} prompt {PromptId} status {Status} schema {SchemaVersion}",
            userId,
            request.PromptId,
            request.Status,
            schemaVersion);

        if (!string.IsNullOrWhiteSpace(request.PromptId))
        {
            var existing = await FindByPromptIdAsync(userId, request.PromptId);
            if (existing != null)
            {
                if (IsFinalized(existing))
                {
                    _logger.LogInformation(
                        "Ignoring duplicate unlock prompt {PromptId} with existing status {Status}",
                        request.PromptId,
                        existing.Status);
                    return _mapper.Map<PhoneUnlockEntryDto>(existing);
                }

                ApplyRequest(existing, request, schemaVersion);
                existing.UpdatedAt = DateTime.UtcNow;
                await _context.PhoneUnlockEntries.ReplaceOneAsync(entry => entry.Id == existing.Id, existing);
                return _mapper.Map<PhoneUnlockEntryDto>(existing);
            }
        }

        var entry = new PhoneUnlockEntry
        {
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        ApplyRequest(entry, request, schemaVersion);
        await _context.PhoneUnlockEntries.InsertOneAsync(entry);
        _logger.LogInformation("Phone unlock entry {EntryId} saved", entry.Id);
        return _mapper.Map<PhoneUnlockEntryDto>(entry);
    }

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

    private async Task<PhoneUnlockEntry?> FindByPromptIdAsync(string userId, string promptId)
    {
        var filter = Builders<PhoneUnlockEntry>.Filter.And(
            Builders<PhoneUnlockEntry>.Filter.Eq(entry => entry.UserId, userId),
            Builders<PhoneUnlockEntry>.Filter.Eq(entry => entry.PromptId, promptId)
        );
        return await _context.PhoneUnlockEntries.Find(filter).FirstOrDefaultAsync();
    }

    private static bool IsFinalized(PhoneUnlockEntry entry)
    {
        return !string.Equals(entry.Status, "pending", StringComparison.Ordinal) &&
               !string.IsNullOrWhiteSpace(entry.Status);
    }

    private static void ApplyRequest(PhoneUnlockEntry entry, CreatePhoneUnlockEntryRequest request, int schemaVersion)
    {
        var intention = EmptyToNull(request.IntentionCode);
        var unlockedAt = request.UnlockedAt ?? request.ShownAtUtc ?? DateTime.UtcNow;

        entry.PromptId = EmptyToNull(request.PromptId) ?? entry.PromptId;
        entry.SchemaVersion = schemaVersion;
        entry.UnlockEventId = EmptyToNull(request.UnlockEventId);
        entry.ShownAtUtc = request.ShownAtUtc ?? unlockedAt;
        entry.UtcOffsetMinutesAtShown = request.UtcOffsetMinutesAtShown;
        entry.ResolvedAtUtc = request.ResolvedAtUtc;
        entry.Status = EmptyToNull(request.Status);
        entry.Action = EmptyToNull(request.Action);
        entry.IntentionCode = intention;
        entry.TriggerCode = EmptyToNull(request.TriggerCode);
        entry.FeelingCode = EmptyToNull(request.FeelingCode);
        entry.Note = TrimNote(request.Note);
        entry.ContextExpanded = request.ContextExpanded;
        entry.SubmissionPath = EmptyToNull(request.SubmissionPath);
        entry.PutDownExecution = EmptyToNull(request.PutDownExecution);
        entry.Reason = intention ?? string.Empty;
        entry.UnlockedAt = unlockedAt;
        entry.UnlockMethod = EmptyToNull(request.UnlockMethod);
    }

    private static string? EmptyToNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? TrimNote(string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
        {
            return null;
        }

        var trimmed = note.Trim();
        return trimmed.Length <= 200 ? trimmed : trimmed[..200];
    }
}
