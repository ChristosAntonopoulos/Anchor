using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Schedule;
using POS.Core.Schedule;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Schedule;

/// <summary>
/// Idempotent migration: align existing Morning/Evening schedule definitions
/// to <see cref="RoutineCatalog"/> so schedule blocks match immersive modes.
/// </summary>
public class RoutineUnificationMigrator
{
    private readonly MongoDbContext _context;
    private readonly ILogger<RoutineUnificationMigrator> _logger;

    public RoutineUnificationMigrator(MongoDbContext context, ILogger<RoutineUnificationMigrator> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task MigrateAsync(CancellationToken ct = default)
    {
        var definitions = await _context.ScheduleBlockDefinitions
            .Find(d => d.Kind == ScheduleBlockKind.Routine)
            .ToListAsync(ct);

        var updated = 0;
        foreach (var definition in definitions)
        {
            UnifiedRoutine? routine = null;
            if (RoutineCatalog.IsMorningTitle(definition.Title))
                routine = RoutineCatalog.Morning;
            else if (RoutineCatalog.IsEveningTitle(definition.Title))
                routine = RoutineCatalog.Night;

            if (routine == null)
                continue;

            if (AlreadyUnified(definition, routine))
                continue;

            definition.Title = routine.Title;
            definition.FixedStartTime = routine.StartTime;
            definition.FixedEndTime = routine.EndTime;
            definition.DurationMinutes = routine.DurationMinutes;
            definition.PreferredTimeTag = routine.Key == "morning" ? "morning" : "evening";
            definition.RoutineActivities = routine.ActivityTitles.ToList();
            definition.ShorterRoutineActivities = routine.ShorterActivityTitles.ToList();
            definition.Tags = MergeTags(definition.Tags, routine.Key);
            definition.UpdatedAt = DateTime.UtcNow;

            await _context.ScheduleBlockDefinitions.ReplaceOneAsync(
                d => d.Id == definition.Id,
                definition,
                cancellationToken: ct);
            updated++;
        }

        if (updated > 0)
        {
            _logger.LogInformation(
                "Routine unification migrated {Count} schedule definitions to {Version}",
                updated,
                RoutineCatalog.CatalogVersion);
        }
        else
        {
            _logger.LogInformation("Routine unification: no schedule definitions needed update.");
        }
    }

    private static bool AlreadyUnified(ScheduleBlockDefinition definition, UnifiedRoutine routine)
    {
        if (definition.FixedStartTime != routine.StartTime || definition.FixedEndTime != routine.EndTime)
            return false;

        if (!SameList(definition.RoutineActivities, routine.ActivityTitles))
            return false;

        if (!SameList(definition.ShorterRoutineActivities, routine.ShorterActivityTitles))
            return false;

        return definition.Tags?.Any(t =>
                   string.Equals(t, RoutineCatalog.CatalogVersion, StringComparison.OrdinalIgnoreCase)) == true;
    }

    private static bool SameList(IReadOnlyList<string>? left, IReadOnlyList<string> right)
    {
        if (left == null || left.Count != right.Count)
            return false;

        for (var i = 0; i < right.Count; i++)
        {
            if (!string.Equals(left[i], right[i], StringComparison.Ordinal))
                return false;
        }

        return true;
    }

    private static string[] MergeTags(string[]? existing, string routineKey)
    {
        var set = new HashSet<string>(existing ?? Array.Empty<string>(), StringComparer.OrdinalIgnoreCase)
        {
            "routine",
            routineKey,
            RoutineCatalog.CatalogVersion
        };
        return set.ToArray();
    }
}
