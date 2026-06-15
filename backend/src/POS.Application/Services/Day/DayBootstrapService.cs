using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using POS.Application.Configuration;
using POS.Application.DTOs.Day;
using POS.Application.Services.Tasks;
using POS.Core.Constants;
using POS.Core.Entities;
using POS.Infrastructure.Data;
using POS.Infrastructure.Services;
using DayEntity = POS.Core.Entities.Day;

namespace POS.Application.Services.Day;

/// <summary>
/// First-call-of-day bootstrap: rollover tasks, materialize schedule, trigger AI day-start.
/// </summary>
public class DayBootstrapService
{
    private static readonly TimeSpan ProcessingTimeout = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan FailedRetryCooldown = TimeSpan.FromMinutes(2);

    private readonly MongoDbContext _context;
    private readonly TaskService _taskService;
    private readonly ScheduleMaterializationService _scheduleMaterialization;
    private readonly BotSystemDayStartClient _dayStartClient;
    private readonly UserDayClock _dayClock;
    private readonly BotSystemOptions _botSystemOptions;
    private readonly ILogger<DayBootstrapService> _logger;

    public DayBootstrapService(
        MongoDbContext context,
        TaskService taskService,
        ScheduleMaterializationService scheduleMaterialization,
        BotSystemDayStartClient dayStartClient,
        UserDayClock dayClock,
        IOptions<BotSystemOptions> botSystemOptions,
        ILogger<DayBootstrapService> logger)
    {
        _context = context;
        _taskService = taskService;
        _scheduleMaterialization = scheduleMaterialization;
        _dayStartClient = dayStartClient;
        _dayClock = dayClock;
        _botSystemOptions = botSystemOptions.Value;
        _logger = logger;
    }

    public async Task<DayBootstrapDto> EnsureDayBootstrapAsync(string userId, CancellationToken ct = default)
    {
        var today = await _dayClock.GetTodayAsync(userId, ct);
        var day = await GetOrCreateDayAsync(userId, today, ct);
        day = NormalizeBootstrapStatus(day);

        if (day.BootstrapStatus == DayBootstrapStatus.Ready)
        {
            await TryApplyPendingPlanAsync(userId, today, day, ct);
            return MapBootstrapDto(await GetDayAsync(userId, today, ct) ?? day);
        }

        if (day.BootstrapStatus == DayBootstrapStatus.Processing)
        {
            if (day.BootstrapStartedAt.HasValue &&
                DateTime.UtcNow - day.BootstrapStartedAt.Value < ProcessingTimeout)
            {
                await TryApplyPendingPlanAsync(userId, today, day, ct);
                return MapBootstrapDto(await GetDayAsync(userId, today, ct) ?? day);
            }

            _logger.LogWarning("Day bootstrap stale for user {UserId}; resetting to pending", userId);
            day = await UpdateDayStatusAsync(userId, today, DayBootstrapStatus.Pending, ct: ct);
        }

        if (day.BootstrapStatus == DayBootstrapStatus.Failed)
        {
            if (!CanRetryFailed(day))
                return MapBootstrapDto(day);

            _logger.LogInformation("Retrying failed day bootstrap for user {UserId}", userId);
            day = await UpdateDayStatusAsync(userId, today, DayBootstrapStatus.Pending, clearError: true, ct: ct);
        }

        await _taskService.RolloverStaleTodayTasksAsync(userId, today, ct);
        await _scheduleMaterialization.MaterializeForDateAsync(userId, today, ct);

        day = await UpdateDayStatusAsync(
            userId,
            today,
            DayBootstrapStatus.Processing,
            startedAt: DateTime.UtcNow,
            ct: ct);

        await _taskService.DeleteDayStartTasksAsync(userId, today, ct);

        if (string.IsNullOrWhiteSpace(_botSystemOptions.BaseUrl))
        {
            _logger.LogInformation("BotSystem not configured; marking day ready without AI for user {UserId}", userId);
            day = await UpdateDayStatusAsync(userId, today, DayBootstrapStatus.Ready, ct: ct);
            return MapBootstrapDto(day);
        }

        var userIdCopy = userId;
        var todayCopy = today;
        _ = Task.Run(async () =>
        {
            try
            {
                await _dayStartClient.TryRunDayStartAsync(userIdCopy, CancellationToken.None);
                var currentDay = await GetDayAsync(userIdCopy, todayCopy, CancellationToken.None);
                if (currentDay == null)
                    return;

                var applied = await TryApplyPendingPlanAsync(userIdCopy, todayCopy, currentDay, CancellationToken.None);
                if (!applied)
                {
                    await UpdateDayStatusAsync(
                        userIdCopy,
                        todayCopy,
                        DayBootstrapStatus.Failed,
                        error: "Day-start produced no plan",
                        ct: CancellationToken.None);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background day-start failed for user {UserId}", userIdCopy);
                await UpdateDayStatusAsync(
                    userIdCopy,
                    todayCopy,
                    DayBootstrapStatus.Failed,
                    error: ex.Message,
                    ct: CancellationToken.None);
            }
        }, CancellationToken.None);

        return MapBootstrapDto(day);
    }

    public async Task<DayBootstrapDto> GetBootstrapStatusAsync(string userId, CancellationToken ct = default)
    {
        var today = await _dayClock.GetTodayAsync(userId, ct);
        var day = await GetDayAsync(userId, today, ct);
        if (day == null)
            return new DayBootstrapDto { Status = DayBootstrapStatus.Pending, AssessmentSeen = false };

        if (day.BootstrapStatus == DayBootstrapStatus.Processing)
        {
            if (day.BootstrapStartedAt.HasValue &&
                DateTime.UtcNow - day.BootstrapStartedAt.Value >= ProcessingTimeout)
            {
                day = await UpdateDayStatusAsync(
                    userId,
                    today,
                    DayBootstrapStatus.Failed,
                    error: "Day-start timed out",
                    ct: ct);
            }
            else
            {
                await TryApplyPendingPlanAsync(userId, today, day, ct);
                day = await GetDayAsync(userId, today, ct) ?? day;
            }
        }

        if (day.BootstrapStatus == DayBootstrapStatus.Failed && CanRetryFailed(day))
            return await EnsureDayBootstrapAsync(userId, ct);

        return MapBootstrapDto(day);
    }

    public async Task MarkAssessmentSeenAsync(string userId, CancellationToken ct = default)
    {
        var today = await _dayClock.GetTodayAsync(userId, ct);
        var filter = DayFilter(userId, today);
        var update = Builders<DayEntity>.Update
            .Set(d => d.AssessmentSeenAt, DateTime.UtcNow)
            .Set(d => d.UpdatedAt, DateTime.UtcNow);
        await _context.Days.UpdateOneAsync(filter, update, cancellationToken: ct);
    }

    private static bool CanRetryFailed(DayEntity day) =>
        DateTime.UtcNow - day.UpdatedAt >= FailedRetryCooldown;

    private async Task<bool> TryApplyPendingPlanAsync(
        string userId,
        DateTime today,
        DayEntity day,
        CancellationToken ct)
    {
        var planFilter = Builders<DayStartPlan>.Filter.And(
            Builders<DayStartPlan>.Filter.Eq(p => p.UserId, userId),
            Builders<DayStartPlan>.Filter.Eq(p => p.Date, today),
            Builders<DayStartPlan>.Filter.Eq(p => p.Applied, false));

        var plan = await _context.DayStartPlans.Find(planFilter)
            .SortByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (plan == null)
            return false;

        var dayUpdate = Builders<DayEntity>.Update
            .Set(d => d.YesterdayAssessment, plan.YesterdayAssessment)
            .Set(d => d.BootstrapStatus, DayBootstrapStatus.Ready)
            .Set(d => d.BootstrappedAt, DateTime.UtcNow)
            .Set(d => d.BootstrapError, null)
            .Set(d => d.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(plan.FocusCategory))
            dayUpdate = dayUpdate.Set(d => d.FocusCategory, plan.FocusCategory);

        await _context.Days.UpdateOneAsync(DayFilter(userId, today), dayUpdate, cancellationToken: ct);

        var planUpdate = Builders<DayStartPlan>.Update.Set(p => p.Applied, true);
        await _context.DayStartPlans.UpdateOneAsync(
            Builders<DayStartPlan>.Filter.Eq(p => p.Id, plan.Id),
            planUpdate,
            cancellationToken: ct);

        _logger.LogInformation("Applied day-start plan for user {UserId} on {Date}", userId, today);
        return true;
    }

    private async Task<DayEntity> GetOrCreateDayAsync(string userId, DateTime today, CancellationToken ct)
    {
        var day = await GetDayAsync(userId, today, ct);
        if (day != null)
            return day;

        day = new DayEntity
        {
            UserId = userId,
            Date = today,
            BootstrapStatus = DayBootstrapStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        await _context.Days.InsertOneAsync(day, cancellationToken: ct);
        return day;
    }

    private async Task<DayEntity?> GetDayAsync(string userId, DateTime today, CancellationToken ct) =>
        await _context.Days.Find(DayFilter(userId, today)).FirstOrDefaultAsync(ct);

    private async Task<DayEntity> UpdateDayStatusAsync(
        string userId,
        DateTime today,
        string status,
        DateTime? startedAt = null,
        string? error = null,
        bool clearError = false,
        CancellationToken ct = default)
    {
        var update = Builders<DayEntity>.Update
            .Set(d => d.BootstrapStatus, status)
            .Set(d => d.UpdatedAt, DateTime.UtcNow);

        if (startedAt.HasValue)
            update = update.Set(d => d.BootstrapStartedAt, startedAt.Value);
        if (error != null)
            update = update.Set(d => d.BootstrapError, error);
        if (clearError)
            update = update.Unset(d => d.BootstrapError);
        if (status == DayBootstrapStatus.Ready)
            update = update.Set(d => d.BootstrappedAt, DateTime.UtcNow);

        await _context.Days.UpdateOneAsync(DayFilter(userId, today), update, cancellationToken: ct);
        return (await GetDayAsync(userId, today, ct))!;
    }

    private static DayEntity NormalizeBootstrapStatus(DayEntity day)
    {
        if (string.IsNullOrWhiteSpace(day.BootstrapStatus))
            day.BootstrapStatus = DayBootstrapStatus.Pending;
        return day;
    }

    private static FilterDefinition<DayEntity> DayFilter(string userId, DateTime today) =>
        Builders<DayEntity>.Filter.And(
            Builders<DayEntity>.Filter.Eq(d => d.UserId, userId),
            Builders<DayEntity>.Filter.Eq(d => d.Date, today));

    private static DayBootstrapDto MapBootstrapDto(DayEntity day) =>
        new()
        {
            Status = day.BootstrapStatus,
            AssessmentSeen = day.AssessmentSeenAt.HasValue,
            Error = day.BootstrapError,
            YesterdayAssessment = day.YesterdayAssessment == null
                ? null
                : new YesterdayAssessmentDto
                {
                    Summary = day.YesterdayAssessment.Summary,
                    Wins = day.YesterdayAssessment.Wins,
                    Misses = day.YesterdayAssessment.Misses,
                    CarryForward = day.YesterdayAssessment.CarryForward,
                    MoodNote = day.YesterdayAssessment.MoodNote,
                    GeneratedAt = day.YesterdayAssessment.GeneratedAt
                }
        };
}
