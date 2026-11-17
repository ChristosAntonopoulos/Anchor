using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Assistant;
using POS.Core.Entities.Discipline;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Discipline;

/// <summary>
/// Habit templates used to generate daily discipline entries. Seeded only if missing.
/// </summary>
public class HabitDefinitionService
{
    public static readonly HashSet<string> ProtectedItemIds = new(StringComparer.OrdinalIgnoreCase)
    {
        "Coffee",
        "Cigarettes",
    };

    private readonly MongoDbContext _context;
    private readonly ILogger<HabitDefinitionService> _logger;

    public HabitDefinitionService(MongoDbContext context, ILogger<HabitDefinitionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EnsureDefaultsAsync(string userId, CancellationToken ct = default)
    {
        var filter = Builders<HabitDefinition>.Filter.Eq(h => h.UserId, userId);
        var count = await _context.HabitDefinitions.CountDocumentsAsync(filter, cancellationToken: ct);
        if (count > 0)
            return;

        var now = DateTime.UtcNow;
        var defaults = DefaultHabits(userId, now);
        await _context.HabitDefinitions.InsertManyAsync(defaults, cancellationToken: ct);
        _logger.LogInformation("Seeded {Count} habit definitions for user {UserId}", defaults.Count, userId);
    }

    public async Task<List<AssistantHabitDto>> ListAsync(string userId, CancellationToken ct = default)
    {
        await EnsureDefaultsAsync(userId, ct);
        var habits = await _context.HabitDefinitions
            .Find(h => h.UserId == userId)
            .SortBy(h => h.BlockOrder)
            .ThenBy(h => h.Order)
            .ToListAsync(ct);
        return habits.Select(ToDto).ToList();
    }

    public async Task<AssistantHabitDto> UpsertAsync(
        string userId,
        AssistantHabitUpsertRequest request,
        CancellationToken ct = default)
    {
        await EnsureDefaultsAsync(userId, ct);
        var itemId = request.ItemId.Trim();
        var existing = await _context.HabitDefinitions
            .Find(h => h.UserId == userId && h.ItemId == itemId)
            .FirstOrDefaultAsync(ct);

        if (existing == null)
        {
            existing = new HabitDefinition
            {
                UserId = userId,
                ItemId = itemId,
                Key = itemId,
                CreatedAt = DateTime.UtcNow,
            };
        }
        else if (existing.Protected || ProtectedItemIds.Contains(existing.ItemId))
        {
            // Allow rename/schedule/active changes but keep protected flag and counters type.
            existing.Protected = true;
        }

        existing.ItemName = request.ItemName.Trim();
        existing.Title = existing.ItemName;
        existing.Key = itemId;
        if (!string.IsNullOrWhiteSpace(request.Type))
        {
            existing.ItemType = ParseType(request.Type);
        }
        else if (string.IsNullOrEmpty(existing.Id))
        {
            existing.ItemType = DisciplineItemType.Toggle;
        }

        existing.BlockId = string.IsNullOrWhiteSpace(request.BlockId) ? existing.BlockId : request.BlockId.Trim();
        if (string.IsNullOrWhiteSpace(existing.BlockId))
            existing.BlockId = "HabitTracking";
        existing.BlockName = string.IsNullOrWhiteSpace(request.BlockName)
            ? (string.IsNullOrWhiteSpace(existing.BlockName) ? existing.BlockId : existing.BlockName)
            : request.BlockName.Trim();
        if (request.BlockOrder.HasValue) existing.BlockOrder = request.BlockOrder.Value;
        if (request.Active.HasValue) existing.Active = request.Active.Value;
        if (request.DaysOfWeek != null)
            existing.DaysOfWeek = request.DaysOfWeek.Length == 0 ? null : request.DaysOfWeek;
        if (request.Order.HasValue) existing.Order = request.Order.Value;
        if (request.Enabled.HasValue) existing.Enabled = request.Enabled.Value;
        if (ProtectedItemIds.Contains(itemId))
            existing.Protected = true;
        existing.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrEmpty(existing.Id))
            await _context.HabitDefinitions.InsertOneAsync(existing, cancellationToken: ct);
        else
            await _context.HabitDefinitions.ReplaceOneAsync(h => h.Id == existing.Id, existing, cancellationToken: ct);

        return ToDto(existing);
    }

    public async Task<AssistantHabitDto> PatchAsync(
        string userId,
        string itemId,
        AssistantHabitPatchRequest request,
        CancellationToken ct = default)
    {
        await EnsureDefaultsAsync(userId, ct);
        var existing = await _context.HabitDefinitions
            .Find(h => h.UserId == userId && h.ItemId == itemId)
            .FirstOrDefaultAsync(ct)
            ?? throw new ArgumentException($"Habit '{itemId}' not found.");

        if (request.ItemName != null)
        {
            existing.ItemName = request.ItemName.Trim();
            existing.Title = existing.ItemName;
        }
        if (request.Type != null && !existing.Protected)
            existing.ItemType = ParseType(request.Type);
        if (request.BlockId != null) existing.BlockId = request.BlockId.Trim();
        if (request.BlockName != null) existing.BlockName = request.BlockName.Trim();
        if (request.BlockOrder.HasValue) existing.BlockOrder = request.BlockOrder.Value;
        if (request.Active.HasValue) existing.Active = request.Active.Value;
        if (request.DaysOfWeek != null)
            existing.DaysOfWeek = request.DaysOfWeek.Length == 0 ? null : request.DaysOfWeek;
        if (request.Order.HasValue) existing.Order = request.Order.Value;
        if (request.Enabled.HasValue) existing.Enabled = request.Enabled.Value;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.HabitDefinitions.ReplaceOneAsync(h => h.Id == existing.Id, existing, cancellationToken: ct);
        return ToDto(existing);
    }

    public async Task<AssistantHabitDto> SetActiveAsync(
        string userId,
        string itemId,
        bool active,
        CancellationToken ct = default)
    {
        return await PatchAsync(userId, itemId, new AssistantHabitPatchRequest { Active = active }, ct);
    }

    public async Task DeleteAsync(string userId, string itemId, CancellationToken ct = default)
    {
        await EnsureDefaultsAsync(userId, ct);
        var existing = await _context.HabitDefinitions
            .Find(h => h.UserId == userId && h.ItemId == itemId)
            .FirstOrDefaultAsync(ct)
            ?? throw new ArgumentException($"Habit '{itemId}' not found.");

        if (existing.Protected || ProtectedItemIds.Contains(existing.ItemId))
            throw new InvalidOperationException($"Habit '{itemId}' is protected and cannot be deleted.");

        await _context.HabitDefinitions.DeleteOneAsync(h => h.Id == existing.Id, ct);
    }

    public async Task<List<DisciplineBlock>> BuildBlocksForDateAsync(
        string userId,
        DateTime date,
        CancellationToken ct = default)
    {
        await EnsureDefaultsAsync(userId, ct);
        var habits = await _context.HabitDefinitions
            .Find(h => h.UserId == userId && h.Enabled)
            .ToListAsync(ct);

        var day = (int)date.DayOfWeek;
        var active = habits
            .Where(h => h.Active)
            .Where(h => AppliesOnDay(h, day))
            .OrderBy(h => h.BlockOrder)
            .ThenBy(h => h.Order)
            .ToList();

        return active
            .GroupBy(h => h.BlockId, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Min(x => x.BlockOrder))
            .Select(g =>
            {
                var first = g.First();
                return new DisciplineBlock
                {
                    BlockId = first.BlockId,
                    BlockName = first.BlockName,
                    Order = first.BlockOrder,
                    Items = g.Select(h => new DisciplineItem
                    {
                        ItemId = h.ItemId,
                        ItemName = h.ItemName,
                        Type = h.ItemType,
                        ToggleValue = h.ItemType == DisciplineItemType.Toggle ? false : null,
                        CounterValue = h.ItemType == DisciplineItemType.Counter ? 0 : null,
                    }).ToList(),
                };
            })
            .ToList();
    }

    private static bool AppliesOnDay(HabitDefinition habit, int dayOfWeek)
    {
        if (habit.DaysOfWeek == null || habit.DaysOfWeek.Length == 0)
            return true;
        return habit.DaysOfWeek.Contains(dayOfWeek);
    }

    private static DisciplineItemType ParseType(string type) =>
        string.Equals(type, "counter", StringComparison.OrdinalIgnoreCase)
            ? DisciplineItemType.Counter
            : DisciplineItemType.Toggle;

    public static AssistantHabitDto ToDto(HabitDefinition h) =>
        new()
        {
            Id = h.Id,
            ItemId = h.ItemId,
            ItemName = h.ItemName,
            Type = h.ItemType == DisciplineItemType.Counter ? "counter" : "toggle",
            BlockId = h.BlockId,
            BlockName = h.BlockName,
            BlockOrder = h.BlockOrder,
            Active = h.Active,
            DaysOfWeek = h.DaysOfWeek,
            Order = h.Order,
            Protected = h.Protected || ProtectedItemIds.Contains(h.ItemId),
            Enabled = h.Enabled,
        };

    public static List<HabitDefinition> DefaultHabits(string userId, DateTime now)
    {
        var habits = new List<HabitDefinition>();
        var order = 0;
        void Add(string blockId, string blockName, int blockOrder, string itemId, string name, DisciplineItemType type, bool protect = false)
        {
            habits.Add(new HabitDefinition
            {
                UserId = userId,
                Key = itemId,
                Title = name,
                ItemId = itemId,
                ItemName = name,
                ItemType = type,
                BlockId = blockId,
                BlockName = blockName,
                BlockOrder = blockOrder,
                Order = order++,
                Active = true,
                Enabled = true,
                Protected = protect,
                Frequency = HabitFrequency.Daily,
                CreatedAt = now,
            });
        }

        Add("75Hard", "75 Hard", 0, "DietFollowed", "Diet followed (no cheat meals, no alcohol)", DisciplineItemType.Toggle);
        Add("75Hard", "75 Hard", 0, "Workout1", "Workout #1 (45 min)", DisciplineItemType.Toggle);
        Add("75Hard", "75 Hard", 0, "Workout2", "Workout #2 (45 min – outdoor)", DisciplineItemType.Toggle);
        Add("75Hard", "75 Hard", 0, HydrationDefaults.ItemId, HydrationDefaults.ItemName, DisciplineItemType.Counter);
        Add("75Hard", "75 Hard", 0, "Read10Pages", "Read 10 pages nonfiction", DisciplineItemType.Toggle);
        Add("75Hard", "75 Hard", 0, "ProgressPhoto", "Progress photo", DisciplineItemType.Toggle);

        Add("HabitTracking", "Habit Tracking", 1, "PrivateActivity", "Private Activity", DisciplineItemType.Counter);
        Add("HabitTracking", "Habit Tracking", 1, "Cigarettes", "Cigarettes", DisciplineItemType.Counter, protect: true);
        Add("HabitTracking", "Habit Tracking", 1, "Coffee", "Coffee", DisciplineItemType.Counter, protect: true);

        return habits;
    }
}
