using Microsoft.Extensions.Logging;
using POS.Application.Services.Discipline;
using POS.Core.Constants;
using POS.Infrastructure.Services;

namespace POS.Application.Services.Schedule;

/// <summary>
/// Startup ensure-defaults only. Never overwrites user-saved schedule times or routine steps.
/// </summary>
public class RoutineUnificationMigrator
{
    private readonly ScheduleMaterializationService _materialization;
    private readonly RoutineDefinitionService _routines;
    private readonly HabitDefinitionService _habits;
    private readonly ILogger<RoutineUnificationMigrator> _logger;

    public RoutineUnificationMigrator(
        ScheduleMaterializationService materialization,
        RoutineDefinitionService routines,
        HabitDefinitionService habits,
        ILogger<RoutineUnificationMigrator> logger)
    {
        _materialization = materialization;
        _routines = routines;
        _habits = habits;
        _logger = logger;
    }

    public async Task MigrateAsync(CancellationToken ct = default)
    {
        var userId = AppConstants.DefaultUserId;
        await _routines.EnsureDefaultsAsync(userId, ct);
        await _habits.EnsureDefaultsAsync(userId, ct);
        await _materialization.EnsureDefaultDefinitionsAsync(userId, ct);
        _logger.LogInformation(
            "Routine/habit/schedule ensure-defaults completed for user {UserId} (seed-if-missing only).",
            userId);
    }
}
