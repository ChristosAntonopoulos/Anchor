using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Schedule;
using POS.Core.Schedule;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Services;

/// <summary>
/// Ensures schedule block definitions exist and materializes daily instances from templates.
/// Seeds named defaults only when missing — never overwrites user-saved times.
/// </summary>
public class ScheduleMaterializationService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<ScheduleMaterializationService> _logger;

    public ScheduleMaterializationService(MongoDbContext context, ILogger<ScheduleMaterializationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EnsureDefaultDefinitionsAsync(string userId, CancellationToken ct = default)
    {
        var existing = await _context.ScheduleBlockDefinitions
            .Find(d => d.UserId == userId)
            .ToListAsync(ct);

        var existingTitles = existing
            .Select(d => d.Title)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var now = DateTime.UtcNow;
        var missing = DefaultDefinitions(userId, now)
            .Where(d => !existingTitles.Contains(d.Title))
            .ToList();

        if (missing.Count == 0)
            return;

        _logger.LogInformation(
            "Seeding {Count} missing schedule definitions for user {UserId}: {Titles}",
            missing.Count,
            userId,
            string.Join(", ", missing.Select(m => m.Title)));
        await _context.ScheduleBlockDefinitions.InsertManyAsync(missing, cancellationToken: ct);
    }

    public async Task MaterializeForDateAsync(string userId, DateTime date, CancellationToken ct = default)
    {
        await EnsureDefaultDefinitionsAsync(userId, ct);

        var instanceFilter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Date, date.Date));

        var existing = await _context.ScheduleBlockInstances.CountDocumentsAsync(instanceFilter, cancellationToken: ct);
        if (existing > 0)
            return;

        var defFilter = Builders<ScheduleBlockDefinition>.Filter.And(
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.UserId, userId),
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.Enabled, true));

        var definitions = await _context.ScheduleBlockDefinitions.Find(defFilter)
            .SortBy(d => d.Priority)
            .ThenBy(d => d.FixedStartTime)
            .ToListAsync(ct);

        var dayOfWeek = (int)date.DayOfWeek;
        var matching = definitions.Where(d => AppliesOnDate(d, dayOfWeek)).ToList();

        if (matching.Count == 0)
        {
            _logger.LogWarning("No schedule definitions apply for user {UserId} on {Date}", userId, date.Date);
            return;
        }

        var instances = matching.Select(def => CreateInstanceFromDefinition(def, userId, date)).ToList();
        await _context.ScheduleBlockInstances.InsertManyAsync(instances, cancellationToken: ct);
        _logger.LogInformation(
            "Materialized {Count} schedule instances for user {UserId} on {Date}",
            instances.Count, userId, date.Date);
    }

    internal static bool AppliesOnDate(ScheduleBlockDefinition definition, int dayOfWeek)
    {
        return definition.Recurrence switch
        {
            RecurrenceType.Daily => true,
            RecurrenceType.Weekly => definition.DaysOfWeek?.Contains(dayOfWeek) == true,
            RecurrenceType.None when definition.Kind is ScheduleBlockKind.Fixed or ScheduleBlockKind.Routine => true,
            _ => false
        };
    }

    internal static ScheduleBlockInstance CreateInstanceFromDefinition(
        ScheduleBlockDefinition definition,
        string userId,
        DateTime date)
    {
        var instance = new ScheduleBlockInstance
        {
            UserId = userId,
            Date = date.Date,
            DefinitionId = definition.Id,
            Title = definition.Title,
            StartTime = definition.FixedStartTime ?? "09:00",
            EndTime = definition.FixedEndTime ?? "10:00",
            Locked = definition.Kind is ScheduleBlockKind.Fixed or ScheduleBlockKind.Routine,
            Source = "template",
            RoutineActivities = definition.RoutineActivities?.ToList(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        instance.ChecklistItems = ScheduleChecklistBuilder.BuildForBlock(instance);
        instance.ChecklistVersion = ScheduleChecklistBuilder.CurrentChecklistVersion;
        return instance;
    }

    /// <summary>
    /// Catalog/default schedule titles. Values are seed defaults only — never forced onto saved rows.
    /// Extra titles (Wake, Shutdown, Workout, Weekly Review) are available for assistant control
    /// and appear only when missing for the user.
    /// </summary>
    internal static List<ScheduleBlockDefinition> DefaultDefinitions(string userId, DateTime now) =>
        new()
        {
            Fixed(userId, now, "Wake", "07:15", "07:20", priority: 0, EnergyLevel.Medium, "morning"),
            FromCatalog(userId, now, RoutineCatalog.Morning, priority: 1),
            Fixed(userId, now, "Deep Work", "09:00", "11:00", priority: 2, EnergyLevel.High, "morning"),
            Fixed(userId, now, "Focused Work", "14:00", "16:00", priority: 3, EnergyLevel.Medium, "afternoon"),
            FromCatalog(userId, now, RoutineCatalog.Night, priority: 4),
            Fixed(userId, now, "Shutdown", "22:00", "22:15", priority: 5, EnergyLevel.Low, "evening"),
            new ScheduleBlockDefinition
            {
                UserId = userId,
                Title = "Workout",
                Kind = ScheduleBlockKind.Fixed,
                Recurrence = RecurrenceType.Weekly,
                DaysOfWeek = [1, 3, 5],
                FixedStartTime = "18:00",
                FixedEndTime = "18:45",
                DurationMinutes = 45,
                Enabled = true,
                Priority = 6,
                Energy = EnergyLevel.High,
                PreferredTimeTag = "evening",
                Tags = ["workout"],
                CreatedAt = now
            },
            new ScheduleBlockDefinition
            {
                UserId = userId,
                Title = "Weekly Review",
                Kind = ScheduleBlockKind.Fixed,
                Recurrence = RecurrenceType.Weekly,
                DaysOfWeek = [0],
                FixedStartTime = "10:00",
                FixedEndTime = "11:00",
                DurationMinutes = 60,
                Enabled = true,
                Priority = 7,
                Energy = EnergyLevel.Medium,
                PreferredTimeTag = "morning",
                Tags = ["review"],
                CreatedAt = now
            },
        };

    internal static ScheduleBlockDefinition FromCatalog(
        string userId,
        DateTime now,
        UnifiedRoutine routine,
        int priority) =>
        new()
        {
            UserId = userId,
            Title = routine.Title,
            Kind = ScheduleBlockKind.Routine,
            Recurrence = RecurrenceType.Daily,
            FixedStartTime = routine.StartTime,
            FixedEndTime = routine.EndTime,
            DurationMinutes = routine.DurationMinutes,
            Enabled = true,
            Priority = priority,
            PreferredTimeTag = routine.Key == "morning" ? "morning" : "evening",
            Tags = new[] { "routine", routine.Key, RoutineCatalog.CatalogVersion },
            RoutineActivities = routine.ActivityTitles.ToList(),
            ShorterRoutineActivities = routine.ShorterActivityTitles.ToList(),
            CreatedAt = now
        };

    private static ScheduleBlockDefinition Fixed(
        string userId,
        DateTime now,
        string title,
        string start,
        string end,
        int priority,
        EnergyLevel energy,
        string preferred) =>
        new()
        {
            UserId = userId,
            Title = title,
            Kind = ScheduleBlockKind.Fixed,
            Recurrence = RecurrenceType.Daily,
            FixedStartTime = start,
            FixedEndTime = end,
            DurationMinutes = ScheduleChecklistBuilder.GetBlockDurationMinutes(start, end),
            Enabled = true,
            Priority = priority,
            Energy = energy,
            PreferredTimeTag = preferred,
            CreatedAt = now
        };
}
