using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds today's Day entity
/// </summary>
public class DaySeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<DaySeeder> _logger;

    public DaySeeder(MongoDbContext context, ILogger<DaySeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation("Seeding day {Date} for user {UserId}", today, userId);

        var filter = Builders<Day>.Filter.And(
            Builders<Day>.Filter.Eq(d => d.UserId, userId),
            Builders<Day>.Filter.Eq(d => d.Date, today)
        );

        var existingDay = await _context.Days.Find(filter).FirstOrDefaultAsync();
        if (existingDay != null)
        {
            _logger.LogInformation("Day {Date} already exists for user {UserId}, skipping", today, userId);
            return;
        }

        var day = new Day
        {
            UserId = userId,
            Date = today,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Days.InsertOneAsync(day);
        _logger.LogInformation("Day {Date} seeded successfully for user {UserId}", today, userId);
    }
}
