using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Tasks;
using POS.Infrastructure.Data;
using TaskEntity = POS.Core.Entities.Tasks.Task;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds Tasks for today
/// </summary>
public class TaskSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<TaskSeeder> _logger;

    public TaskSeeder(MongoDbContext context, ILogger<TaskSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task SeedAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation("Seeding Tasks for user {UserId} on {Date}", userId, today);

        var filter = Builders<TaskEntity>.Filter.And(
            Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId),
            Builders<TaskEntity>.Filter.Eq(t => t.Date, today)
        );

        var existingTasks = await _context.Tasks.Find(filter).ToListAsync();
        if (existingTasks.Any())
        {
            _logger.LogInformation("Tasks already exist for user {UserId} on {Date}, skipping", userId, today);
            return;
        }

        var tasks = new List<TaskEntity>
        {
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Review pull requests",
                Category = "work",
                Completed = true,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Update project documentation",
                Category = "work",
                Completed = false,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Follow up with potential client",
                Category = "leverage",
                Completed = false,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Schedule doctor appointment",
                Category = "health",
                Completed = false,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            },
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Pay monthly bills",
                Category = "stability",
                Completed = true,
                Source = "user",
                CreatedAt = DateTime.UtcNow
            }
        };

        await _context.Tasks.InsertManyAsync(tasks);
        _logger.LogInformation("Seeded {Count} Tasks for user {UserId}", tasks.Count, userId);
    }
}
