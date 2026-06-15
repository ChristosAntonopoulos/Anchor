using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Schedule;
using POS.Core.Schedule;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Services;

/// <summary>
/// Ensures schedule block definitions exist and materializes daily instances from templates.
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
        var filter = Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.UserId, userId);
        var count = await _context.ScheduleBlockDefinitions.CountDocumentsAsync(filter, cancellationToken: ct);
        if (count > 0)
            return;

        _logger.LogInformation("Seeding default schedule definitions for user {UserId}", userId);
        var now = DateTime.UtcNow;
        var definitions = DefaultDefinitions(userId, now);
        await _context.ScheduleBlockDefinitions.InsertManyAsync(definitions, cancellationToken: ct);
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

    internal static List<ScheduleBlockDefinition> DefaultDefinitions(string userId, DateTime now) =>
        new()
        {
            new ScheduleBlockDefinition
            {
                UserId = userId,
                Title = "Morning Routine",
                Kind = ScheduleBlockKind.Routine,
                Recurrence = RecurrenceType.Daily,
                FixedStartTime = "06:00",
                FixedEndTime = "07:00",
                Enabled = true,
                Priority = 1,
                RoutineActivities = new List<string> { "Drink water", "Brush teeth", "Morning walk" },
                CreatedAt = now
            },
            new ScheduleBlockDefinition
            {
                UserId = userId,
                Title = "Deep Work",
                Kind = ScheduleBlockKind.Fixed,
                Recurrence = RecurrenceType.Daily,
                FixedStartTime = "09:00",
                FixedEndTime = "11:00",
                Enabled = true,
                Priority = 2,
                Energy = EnergyLevel.High,
                CreatedAt = now
            },
            new ScheduleBlockDefinition
            {
                UserId = userId,
                Title = "Focused Work",
                Kind = ScheduleBlockKind.Fixed,
                Recurrence = RecurrenceType.Daily,
                FixedStartTime = "14:00",
                FixedEndTime = "16:00",
                Enabled = true,
                Priority = 3,
                Energy = EnergyLevel.Medium,
                CreatedAt = now
            },
            new ScheduleBlockDefinition
            {
                UserId = userId,
                Title = "Evening Routine",
                Kind = ScheduleBlockKind.Routine,
                Recurrence = RecurrenceType.Daily,
                FixedStartTime = "21:00",
                FixedEndTime = "22:00",
                Enabled = true,
                Priority = 4,
                RoutineActivities = new List<string> { "Close screens", "Read a book", "Brush teeth" },
                CreatedAt = now
            }
        };
}
