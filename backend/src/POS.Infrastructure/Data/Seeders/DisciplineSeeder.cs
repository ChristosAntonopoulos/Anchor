using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Discipline;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds Discipline Entry for today
/// </summary>
public class DisciplineSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<DisciplineSeeder> _logger;

    public DisciplineSeeder(MongoDbContext context, ILogger<DisciplineSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation("Seeding Discipline Entry for user {UserId} on {Date}", userId, today);

        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, today)
        );

        var existingEntry = await _context.DisciplineEntries.Find(filter).FirstOrDefaultAsync();
        if (existingEntry != null)
        {
            _logger.LogInformation("Discipline Entry already exists for user {UserId} on {Date}, skipping", userId, today);
            return;
        }

        var disciplineEntry = new DisciplineEntry
        {
            UserId = userId,
            Date = today,
            Blocks = new List<DisciplineBlock>
            {
                // 75 Hard Block
                new DisciplineBlock
                {
                    BlockId = "75Hard",
                    BlockName = "75 Hard",
                    Order = 0,
                    Items = new List<DisciplineItem>
                    {
                        new DisciplineItem { ItemId = "DietFollowed", ItemName = "Diet followed (no cheat meals, no alcohol)", Type = DisciplineItemType.Toggle, ToggleValue = false },
                        new DisciplineItem { ItemId = "Workout1", ItemName = "Workout #1 (45 min)", Type = DisciplineItemType.Toggle, ToggleValue = false },
                        new DisciplineItem { ItemId = "Workout2", ItemName = "Workout #2 (45 min – outdoor)", Type = DisciplineItemType.Toggle, ToggleValue = false },
                        new DisciplineItem { ItemId = "GallonWater", ItemName = "1 gallon water", Type = DisciplineItemType.Toggle, ToggleValue = false },
                        new DisciplineItem { ItemId = "Read10Pages", ItemName = "Read 10 pages nonfiction", Type = DisciplineItemType.Toggle, ToggleValue = false },
                        new DisciplineItem { ItemId = "ProgressPhoto", ItemName = "Progress photo", Type = DisciplineItemType.Toggle, ToggleValue = false }
                    }
                },
                // Habit Tracking Block
                new DisciplineBlock
                {
                    BlockId = "HabitTracking",
                    BlockName = "Habit Tracking",
                    Order = 1,
                    Items = new List<DisciplineItem>
                    {
                        new DisciplineItem { ItemId = "PrivateActivity", ItemName = "Private Activity", Type = DisciplineItemType.Counter, CounterValue = 0 },
                        new DisciplineItem { ItemId = "Cigarettes", ItemName = "Cigarettes", Type = DisciplineItemType.Counter, CounterValue = 0 },
                        new DisciplineItem { ItemId = "Coffee", ItemName = "Coffee", Type = DisciplineItemType.Counter, CounterValue = 0 }
                    }
                }
            },
            CreatedAt = DateTime.UtcNow
        };

        await _context.DisciplineEntries.InsertOneAsync(disciplineEntry);
        _logger.LogInformation("Discipline Entry seeded successfully for user {UserId}", userId);
    }
}
