using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.BetterToday;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds Better Items for today
/// </summary>
public class BetterItemSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<BetterItemSeeder> _logger;

    public BetterItemSeeder(MongoDbContext context, ILogger<BetterItemSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation("Seeding Better Items for user {UserId} on {Date}", userId, today);

        var filter = Builders<BetterItem>.Filter.And(
            Builders<BetterItem>.Filter.Eq(bi => bi.UserId, userId),
            Builders<BetterItem>.Filter.Eq(bi => bi.Date, today)
        );

        var existingItems = await _context.BetterItems.Find(filter).ToListAsync();
        if (existingItems.Any())
        {
            _logger.LogInformation("Better Items already exist for user {UserId} on {Date}, skipping", userId, today);
            return;
        }

        var betterItems = new List<BetterItem>
        {
            new BetterItem
            {
                UserId = userId,
                Date = today,
                Title = "Complete morning deep work block",
                Category = "work",
                Completed = false,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new BetterItem
            {
                UserId = userId,
                Date = today,
                Title = "Send 3 client outreach emails",
                Category = "leverage",
                Completed = false,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new BetterItem
            {
                UserId = userId,
                Date = today,
                Title = "20 minute meditation session",
                Category = "health",
                Completed = true,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new BetterItem
            {
                UserId = userId,
                Date = today,
                Title = "Review and update monthly budget",
                Category = "stability",
                Completed = false,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            }
        };

        await _context.BetterItems.InsertManyAsync(betterItems);
        _logger.LogInformation("Seeded {Count} Better Items for user {UserId}", betterItems.Count, userId);
    }
}
