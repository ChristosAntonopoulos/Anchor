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
            Walk = true,
            Diet = true,
            Water = true,
            Gym = false,
            Cooked = false,
            Meditation = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.DisciplineEntries.InsertOneAsync(disciplineEntry);
        _logger.LogInformation("Discipline Entry seeded successfully for user {UserId}", userId);
    }
}
