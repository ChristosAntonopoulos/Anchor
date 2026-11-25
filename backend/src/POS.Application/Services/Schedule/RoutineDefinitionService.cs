using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Assistant;
using POS.Application.DTOs.Routine;
using POS.Core.Entities.Schedule;
using POS.Core.Schedule;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Schedule;

/// <summary>
/// Persisted routines (steps + mode triggers). Catalog values seed only when missing.
/// </summary>
public class RoutineDefinitionService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<RoutineDefinitionService> _logger;

    public RoutineDefinitionService(MongoDbContext context, ILogger<RoutineDefinitionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EnsureDefaultsAsync(string userId, CancellationToken ct = default)
    {
        await EnsureOneAsync(userId, RoutineCatalog.Morning, ct);
        await EnsureOneAsync(userId, RoutineCatalog.Night, ct);
    }

    public async Task<List<UnifiedRoutineDto>> ListAsync(string userId, CancellationToken ct = default)
    {
        await EnsureDefaultsAsync(userId, ct);
        var defs = await _context.RoutineDefinitions
            .Find(d => d.UserId == userId)
            .ToListAsync(ct);
        return defs
            .OrderBy(d => d.Key == "morning" ? 0 : 1)
            .Select(ToDto)
            .ToList();
    }

    public async Task<UnifiedRoutineDto> GetAsync(string userId, string key, CancellationToken ct = default)
    {
        var def = await GetOrSeedAsync(userId, key, ct);
        return ToDto(def);
    }

    public async Task<UnifiedRoutineDto> UpsertAsync(
        string userId,
        string key,
        AssistantRoutineUpsertRequest request,
        CancellationToken ct = default)
    {
        var def = await GetOrSeedAsync(userId, key, ct);
        if (request.Title != null) def.Title = request.Title.Trim();
        if (request.StartTime != null) def.StartTime = request.StartTime.Trim();
        if (request.EndTime != null) def.EndTime = request.EndTime.Trim();
        if (request.TriggerHour.HasValue) def.TriggerHour = request.TriggerHour.Value;
        if (request.TriggerMinute.HasValue) def.TriggerMinute = request.TriggerMinute.Value;
        if (request.Steps != null) def.Steps = MapSteps(request.Steps);
        if (request.ShorterSteps != null) def.ShorterSteps = MapSteps(request.ShorterSteps);
        def.TotalSeconds = def.Steps.Sum(s => Math.Max(0, s.Seconds));
        def.UpdatedAt = DateTime.UtcNow;

        await _context.RoutineDefinitions.ReplaceOneAsync(d => d.Id == def.Id, def, cancellationToken: ct);
        await SyncLinkedScheduleDefinitionAsync(userId, def, ct);
        _logger.LogInformation("Upserted routine {Key} for user {UserId}", def.Key, userId);
        return ToDto(def);
    }

    public async Task<UnifiedRoutineDto> ReplaceStepsAsync(
        string userId,
        string key,
        bool shorter,
        List<RoutineStepDto> steps,
        CancellationToken ct = default)
    {
        var def = await GetOrSeedAsync(userId, key, ct);
        var mapped = MapSteps(steps);
        if (shorter)
            def.ShorterSteps = mapped;
        else
            def.Steps = mapped;
        def.TotalSeconds = def.Steps.Sum(s => Math.Max(0, s.Seconds));
        def.UpdatedAt = DateTime.UtcNow;
        await _context.RoutineDefinitions.ReplaceOneAsync(d => d.Id == def.Id, def, cancellationToken: ct);
        await SyncLinkedScheduleDefinitionAsync(userId, def, ct);
        return ToDto(def);
    }

    public async Task<UnifiedRoutineDto> UpsertStepAsync(
        string userId,
        string key,
        bool shorter,
        RoutineStepDto step,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(step.Id))
            throw new ArgumentException("Step id is required.");

        var def = await GetOrSeedAsync(userId, key, ct);
        var list = shorter ? def.ShorterSteps : def.Steps;
        var existing = list.FirstOrDefault(s =>
            string.Equals(s.Id, step.Id, StringComparison.OrdinalIgnoreCase));
        if (existing == null)
        {
            list.Add(new RoutineStepData
            {
                Id = step.Id.Trim(),
                Title = step.Title?.Trim() ?? step.Id.Trim(),
                Seconds = Math.Max(1, step.Seconds),
                Command = step.Command ?? string.Empty,
                Order = list.Count,
            });
        }
        else
        {
            if (step.Title != null) existing.Title = step.Title.Trim();
            if (step.Seconds > 0) existing.Seconds = step.Seconds;
            if (step.Command != null) existing.Command = step.Command;
        }

        NormalizeOrder(list);
        def.TotalSeconds = def.Steps.Sum(s => Math.Max(0, s.Seconds));
        def.UpdatedAt = DateTime.UtcNow;
        await _context.RoutineDefinitions.ReplaceOneAsync(d => d.Id == def.Id, def, cancellationToken: ct);
        await SyncLinkedScheduleDefinitionAsync(userId, def, ct);
        return ToDto(def);
    }

    public async Task<UnifiedRoutineDto> DeleteStepAsync(
        string userId,
        string key,
        bool shorter,
        string stepId,
        CancellationToken ct = default)
    {
        var def = await GetOrSeedAsync(userId, key, ct);
        var list = shorter ? def.ShorterSteps : def.Steps;
        list.RemoveAll(s => string.Equals(s.Id, stepId, StringComparison.OrdinalIgnoreCase));
        NormalizeOrder(list);
        def.TotalSeconds = def.Steps.Sum(s => Math.Max(0, s.Seconds));
        def.UpdatedAt = DateTime.UtcNow;
        await _context.RoutineDefinitions.ReplaceOneAsync(d => d.Id == def.Id, def, cancellationToken: ct);
        await SyncLinkedScheduleDefinitionAsync(userId, def, ct);
        return ToDto(def);
    }

    public async Task<UnifiedRoutineDto> ReorderStepsAsync(
        string userId,
        string key,
        bool shorter,
        List<string> stepIds,
        CancellationToken ct = default)
    {
        var def = await GetOrSeedAsync(userId, key, ct);
        var list = shorter ? def.ShorterSteps : def.Steps;
        var byId = list.ToDictionary(s => s.Id, StringComparer.OrdinalIgnoreCase);
        var reordered = new List<RoutineStepData>();
        foreach (var id in stepIds)
        {
            if (byId.TryGetValue(id, out var step))
            {
                reordered.Add(step);
                byId.Remove(id);
            }
        }

        reordered.AddRange(byId.Values);
        NormalizeOrder(reordered);
        if (shorter)
            def.ShorterSteps = reordered;
        else
            def.Steps = reordered;
        def.UpdatedAt = DateTime.UtcNow;
        await _context.RoutineDefinitions.ReplaceOneAsync(d => d.Id == def.Id, def, cancellationToken: ct);
        await SyncLinkedScheduleDefinitionAsync(userId, def, ct);
        return ToDto(def);
    }

    public async Task<RoutineDefinition> GetOrSeedAsync(string userId, string key, CancellationToken ct = default)
    {
        var normalized = NormalizeKey(key);
        var existing = await _context.RoutineDefinitions
            .Find(d => d.UserId == userId && d.Key == normalized)
            .FirstOrDefaultAsync(ct);
        if (existing != null)
            return existing;

        var catalog = CatalogFor(normalized);
        await EnsureOneAsync(userId, catalog, ct);
        return await _context.RoutineDefinitions
            .Find(d => d.UserId == userId && d.Key == normalized)
            .FirstAsync(ct);
    }

    private async Task EnsureOneAsync(string userId, UnifiedRoutine catalog, CancellationToken ct)
    {
        var filter = Builders<RoutineDefinition>.Filter.And(
            Builders<RoutineDefinition>.Filter.Eq(d => d.UserId, userId),
            Builders<RoutineDefinition>.Filter.Eq(d => d.Key, catalog.Key));
        var count = await _context.RoutineDefinitions.CountDocumentsAsync(filter, cancellationToken: ct);
        if (count > 0)
            return;

        var entity = FromCatalog(userId, catalog);
        await _context.RoutineDefinitions.InsertOneAsync(entity, cancellationToken: ct);
        _logger.LogInformation("Seeded routine definition {Key} for user {UserId}", catalog.Key, userId);
    }

    /// <summary>
    /// Mirror step titles onto the matching schedule definition when present.
    /// Never creates schedule rows here — schedule seed-if-missing owns that.
    /// Does not overwrite FixedStartTime / FixedEndTime (assistant sets those explicitly).
    /// </summary>
    private async Task SyncLinkedScheduleDefinitionAsync(
        string userId,
        RoutineDefinition routine,
        CancellationToken ct)
    {
        var filter = Builders<ScheduleBlockDefinition>.Filter.And(
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.UserId, userId),
            Builders<ScheduleBlockDefinition>.Filter.Eq(d => d.Title, routine.Title));
        var existing = await _context.ScheduleBlockDefinitions.Find(filter).FirstOrDefaultAsync(ct);
        if (existing == null)
            return;

        var update = Builders<ScheduleBlockDefinition>.Update
            .Set(d => d.RoutineActivities, routine.Steps.OrderBy(s => s.Order).Select(s => s.Title).ToList())
            .Set(d => d.ShorterRoutineActivities, routine.ShorterSteps.OrderBy(s => s.Order).Select(s => s.Title).ToList())
            .Set(d => d.UpdatedAt, DateTime.UtcNow);
        await _context.ScheduleBlockDefinitions.UpdateOneAsync(filter, update, cancellationToken: ct);
    }

    private static RoutineDefinition FromCatalog(string userId, UnifiedRoutine catalog) =>
        new()
        {
            UserId = userId,
            Key = catalog.Key,
            Title = catalog.Title,
            StartTime = catalog.StartTime,
            EndTime = catalog.EndTime,
            TriggerHour = catalog.TriggerHour,
            TriggerMinute = catalog.TriggerMinute,
            TotalSeconds = catalog.TotalSeconds,
            CatalogVersion = RoutineCatalog.CatalogVersion,
            Enabled = true,
            Steps = catalog.Steps.Select((s, i) => new RoutineStepData
            {
                Id = s.Id,
                Title = s.Title,
                Seconds = s.Seconds,
                Command = s.Command,
                Order = i,
            }).ToList(),
            ShorterSteps = catalog.ShorterSteps.Select((s, i) => new RoutineStepData
            {
                Id = s.Id,
                Title = s.Title,
                Seconds = s.Seconds,
                Command = s.Command,
                Order = i,
            }).ToList(),
            CreatedAt = DateTime.UtcNow,
        };

    public static UnifiedRoutineDto ToDto(RoutineDefinition def)
    {
        var catalog = CatalogForLoose(def.Key);
        var steps = NormalizeStepList(def.Steps, catalog.Steps);
        var shorter = NormalizeStepList(def.ShorterSteps, catalog.ShorterSteps);
        return new UnifiedRoutineDto
        {
            Key = catalog.Key,
            Title = string.IsNullOrWhiteSpace(def.Title) ? catalog.Title : def.Title,
            StartTime = string.IsNullOrWhiteSpace(def.StartTime) ? catalog.StartTime : def.StartTime,
            EndTime = string.IsNullOrWhiteSpace(def.EndTime) ? catalog.EndTime : def.EndTime,
            TriggerHour = def.TriggerHour is >= 0 and <= 23 ? def.TriggerHour : catalog.TriggerHour,
            TriggerMinute = def.TriggerMinute is >= 0 and <= 59 ? def.TriggerMinute : catalog.TriggerMinute,
            TotalSeconds = def.TotalSeconds > 0
                ? def.TotalSeconds
                : steps.Sum(s => Math.Max(0, s.Seconds)),
            CatalogVersion = string.IsNullOrWhiteSpace(def.CatalogVersion)
                ? RoutineCatalog.CatalogVersion
                : def.CatalogVersion,
            Steps = steps,
            ShorterSteps = shorter,
            ActivityTitles = steps.Select(s => s.Title).ToList(),
            ShorterActivityTitles = shorter.Select(s => s.Title).ToList(),
        };
    }

    private static List<RoutineStepDto> NormalizeStepList(
        List<RoutineStepData>? stored,
        IReadOnlyList<RoutineStep> catalogFallback)
    {
        var source = (stored ?? [])
            .Where(s => s != null)
            .OrderBy(s => s.Order)
            .Select(ToStepDto)
            .Where(s => !string.IsNullOrWhiteSpace(s.Id))
            .ToList();
        if (source.Count == 0)
        {
            return catalogFallback.Select((s, i) => new RoutineStepDto
            {
                Id = s.Id,
                Title = s.Title,
                Seconds = Math.Max(1, s.Seconds),
                Command = s.Command ?? string.Empty,
            }).ToList();
        }

        for (var i = 0; i < source.Count; i++)
        {
            var s = source[i];
            if (string.IsNullOrWhiteSpace(s.Title)) s.Title = s.Id;
            if (s.Seconds < 1) s.Seconds = catalogFallback.ElementAtOrDefault(i)?.Seconds ?? 60;
            s.Command ??= string.Empty;
        }

        return source;
    }

    private static RoutineStepDto ToStepDto(RoutineStepData s) =>
        new()
        {
            Id = string.IsNullOrWhiteSpace(s.Id) ? string.Empty : s.Id.Trim(),
            Title = s.Title?.Trim() ?? string.Empty,
            Seconds = s.Seconds,
            Command = s.Command ?? string.Empty,
        };

    private static List<RoutineStepData> MapSteps(IEnumerable<RoutineStepDto> steps) =>
        (steps ?? Enumerable.Empty<RoutineStepDto>())
            .Where(s => s != null)
            .Select((s, i) => new RoutineStepData
            {
                Id = string.IsNullOrWhiteSpace(s.Id) ? $"step-{i + 1}" : s.Id.Trim(),
                Title = string.IsNullOrWhiteSpace(s.Title) ? $"Step {i + 1}" : s.Title.Trim(),
                Seconds = Math.Max(1, s.Seconds),
                Command = s.Command ?? string.Empty,
                Order = i,
            }).ToList();

    private static void NormalizeOrder(List<RoutineStepData> steps)
    {
        for (var i = 0; i < steps.Count; i++)
            steps[i].Order = i;
    }

    private static string NormalizeKey(string key)
    {
        var k = (key ?? string.Empty).Trim().ToLowerInvariant();
        if (k is "morning" or "night" or "evening")
            return k == "evening" ? "night" : k;
        throw new ArgumentException("Routine key must be morning or night.");
    }

    private static UnifiedRoutine CatalogFor(string key) =>
        key == "night" ? RoutineCatalog.Night : RoutineCatalog.Morning;

    private static UnifiedRoutine CatalogForLoose(string? key)
    {
        var k = (key ?? string.Empty).Trim().ToLowerInvariant();
        return k is "night" or "evening" ? RoutineCatalog.Night : RoutineCatalog.Morning;
    }
}
