using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Diet;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds Diet Entry for today
/// </summary>
public class DietSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<DietSeeder> _logger;

    public DietSeeder(MongoDbContext context, ILogger<DietSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation("Seeding Diet Entry for user {UserId} on {Date}", userId, today);

        var filter = Builders<DietEntry>.Filter.And(
            Builders<DietEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DietEntry>.Filter.Eq(d => d.Date, today)
        );

        var existingEntry = await _context.DietEntries.Find(filter).FirstOrDefaultAsync();
        if (existingEntry != null)
        {
            _logger.LogInformation("Diet Entry already exists for user {UserId} on {Date}, skipping", userId, today);
            return;
        }

        var dietEntry = new DietEntry
        {
            UserId = userId,
            Date = today,
            Compliant = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.DietEntries.InsertOneAsync(dietEntry);
        _logger.LogInformation("Diet Entry seeded successfully for user {UserId}", userId);
    }
}
