using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.AIBrief;
using POS.Core.Entities.AIBrief;
using POS.Core.Repositories;

namespace POS.Application.Services.AIBrief;

/// <summary>
/// Reads AI-generated daily briefs written by BotSystem's anchor.day-start bot.
/// This service is read-only: Anchor never writes to dayStartPlans — only BotSystem does.
/// </summary>
public class DayStartPlanService
{
    private readonly IDayAnchoredRepository<DayStartPlan> _planRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<DayStartPlanService> _logger;

    public DayStartPlanService(
        IDayAnchoredRepository<DayStartPlan> planRepository,
        IMapper mapper,
        ILogger<DayStartPlanService> logger)
    {
        _planRepository = planRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Returns today's AI brief if BotSystem has generated one, or null if it hasn't run yet.
    /// </summary>
    public async Task<DayStartPlanDto?> GetTodayBriefAsync(string userId)
    {
        _logger.LogDebug("Fetching today's AI brief for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var plan = await _planRepository.GetByDayAsync(userId, today);

        if (plan is null)
        {
            _logger.LogDebug("No AI brief found for user {UserId} on {Date}", userId, today);
            return null;
        }

        return _mapper.Map<DayStartPlanDto>(plan);
    }

    /// <summary>
    /// Marks today's brief as applied (the user has seen/acted on it).
    /// </summary>
    public async Task MarkAppliedAsync(string userId)
    {
        _logger.LogInformation("Marking AI brief as applied for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var plan = await _planRepository.GetByDayAsync(userId, today);

        if (plan is null)
            return;

        plan.Applied = true;
        plan.UpdatedAt = DateTime.UtcNow;
        await _planRepository.UpdateAsync(plan);
    }
}
