using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using POS.Application.DTOs.AIBrief;
using POS.Application.Services.Day;
using POS.Core.Entities.AIBrief;
using POS.Core.Repositories;
using POS.Infrastructure.Data;

namespace POS.Application.Services.AIBrief;

/// <summary>
/// Reads AI-generated daily briefs written by BotSystem's anchor.day-start bot.
/// If none exists for today, returns a usable fallback so the app is never stuck on 204.
/// </summary>
public class DayStartPlanService
{
    private readonly IDayAnchoredRepository<DayStartPlan> _planRepository;
    private readonly MongoDbContext _context;
    private readonly UserDayClock _dayClock;
    private readonly IMapper _mapper;
    private readonly ILogger<DayStartPlanService> _logger;

    public DayStartPlanService(
        IDayAnchoredRepository<DayStartPlan> planRepository,
        MongoDbContext context,
        UserDayClock dayClock,
        IMapper mapper,
        ILogger<DayStartPlanService> logger)
    {
        _planRepository = planRepository;
        _context = context;
        _dayClock = dayClock;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Returns today's AI brief, generating a fallback when BotSystem has not written one.
    /// </summary>
    public async Task<DayStartPlanDto?> GetTodayBriefAsync(string userId)
    {
        _logger.LogDebug("Fetching today's AI brief for user {UserId}", userId);

        var today = await _dayClock.GetTodayAsync(userId);
        var plan = await FindPlanForDayAsync(userId, today);

        if (plan is null)
        {
            _logger.LogInformation("No AI brief found for user {UserId} on {Date}; returning fallback", userId, today);
            return FallbackDto(today);
        }

        return _mapper.Map<DayStartPlanDto>(plan);
    }

    /// <summary>
    /// Marks today's brief as applied (the user has seen/acted on it).
    /// </summary>
    public async Task MarkAppliedAsync(string userId)
    {
        _logger.LogInformation("Marking AI brief as applied for user {UserId}", userId);

        var today = await _dayClock.GetTodayAsync(userId);
        var plan = await FindPlanForDayAsync(userId, today);

        if (plan is null)
            return;

        plan.Applied = true;
        plan.UpdatedAt = DateTime.UtcNow;
        await _planRepository.UpdateAsync(plan);
    }

    private async Task<DayStartPlan?> FindPlanForDayAsync(string userId, DateTime today)
    {
        try
        {
            var typed = await _planRepository.GetByDayAsync(userId, today);
            if (typed != null)
                return typed;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Typed dayStartPlans lookup failed for user {UserId}", userId);
        }

        try
        {
            var all = await _planRepository.FindAsync(p => p.UserId == userId);
            var match = all
                .Where(p => p.Date.Date == today.Date)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault();
            if (match != null)
                return match;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Enumerable dayStartPlans lookup failed for user {UserId}", userId);
        }

        var docs = await _context.DayStartPlansRaw
            .Find(Builders<BsonDocument>.Filter.Eq("userId", userId))
            .Sort(Builders<BsonDocument>.Sort.Descending("createdAt"))
            .ToListAsync();

        foreach (var doc in docs)
        {
            if (!DateMatches(doc.GetValue("date", BsonNull.Value), today))
                continue;

            try
            {
                return BsonSerializer.Deserialize<DayStartPlan>(doc);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not deserialize dayStartPlan {Id}", doc.GetValue("_id", ""));
            }
        }

        return null;
    }

    private static DayStartPlanDto FallbackDto(DateTime today) => new()
    {
        Id = string.Empty,
        Date = today,
        FocusCategory = "health",
        Applied = false,
        TodayFocusTasks = new List<string>(),
        YesterdayAssessment = new YesterdayAssessmentDto
        {
            Summary = "Start the day with your planned meals and your top tasks.",
            GeneratedAt = DateTime.UtcNow
        }
    };

    internal static bool DateMatches(BsonValue dateVal, DateTime today)
    {
        if (dateVal.IsBsonNull)
            return false;

        var expected = today.ToString("yyyy-MM-dd");
        if (dateVal.BsonType == BsonType.DateTime)
            return dateVal.ToUniversalTime().Date == today.Date;

        if (dateVal.IsString)
        {
            var s = dateVal.AsString;
            if (s.StartsWith(expected, StringComparison.Ordinal))
                return true;
            return DateTime.TryParse(s, out var parsed) && parsed.Date == today.Date;
        }

        return false;
    }
}
