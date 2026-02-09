using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Schedule;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds Schedule Blocks for today
/// </summary>
public class ScheduleSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<ScheduleSeeder> _logger;

    public ScheduleSeeder(MongoDbContext context, ILogger<ScheduleSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation("Seeding Schedule Blocks for user {UserId} on {Date}", userId, today);

        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Date, today)
        );

        var existingBlocks = await _context.ScheduleBlockInstances.Find(filter).ToListAsync();
        if (existingBlocks.Any())
        {
            _logger.LogInformation("Schedule Blocks already exist for user {UserId} on {Date}, skipping", userId, today);
            return;
        }

        var scheduleBlocks = new List<ScheduleBlockInstance>
        {
            new ScheduleBlockInstance
            {
                UserId = userId,
                Date = today,
                Title = "Morning Routine",
                StartTime = "06:00",
                EndTime = "07:00",
                Locked = true,
                Source = "user",
                RoutineActivities = new List<string> { "Drink water", "Brush teeth", "Morning walk" },
                CreatedAt = DateTime.UtcNow
            },
            new ScheduleBlockInstance
            {
                UserId = userId,
                Date = today,
                Title = "Deep Work",
                StartTime = "09:00",
                EndTime = "11:00",
                Locked = true,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new ScheduleBlockInstance
            {
                UserId = userId,
                Date = today,
                Title = "Focused Work",
                StartTime = "14:00",
                EndTime = "16:00",
                Locked = true,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new ScheduleBlockInstance
            {
                UserId = userId,
                Date = today,
                Title = "Evening Routine",
                StartTime = "21:00",
                EndTime = "22:00",
                Locked = true,
                Source = "user",
                RoutineActivities = new List<string> { "Close screens", "Read a book", "Brush teeth" },
                CreatedAt = DateTime.UtcNow
            }
        };

        await _context.ScheduleBlockInstances.InsertManyAsync(scheduleBlocks);
        _logger.LogInformation("Seeded {Count} Schedule Blocks for user {UserId}", scheduleBlocks.Count, userId);
    }
}
