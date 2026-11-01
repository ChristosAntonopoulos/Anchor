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
            // 1. Task with location - Show location feature
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Team meeting at coffee shop",
                Category = "work",
                Completed = false,
                Source = "user",
                Location = new Location
                {
                    PlaceName = "Starbucks Downtown",
                    Address = "123 Main Street, Downtown",
                    Latitude = 40.7128,
                    Longitude = -74.0060
                },
                Notes = "Discuss Q4 project roadmap",
                CreatedAt = DateTime.UtcNow.AddHours(-3),
                UpdatedAt = DateTime.UtcNow.AddHours(-3)
            },

            // 2. Task with subtasks/checklist - Show checklist feature
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Prepare presentation for client",
                Category = "leverage",
                Completed = false,
                Source = "user",
                Subtasks = new List<Subtask>
                {
                    new Subtask { Id = Guid.NewGuid().ToString(), Title = "Research client background", Completed = true, Order = 0 },
                    new Subtask { Id = Guid.NewGuid().ToString(), Title = "Create slides deck", Completed = true, Order = 1 },
                    new Subtask { Id = Guid.NewGuid().ToString(), Title = "Practice presentation", Completed = false, Order = 2 },
                    new Subtask { Id = Guid.NewGuid().ToString(), Title = "Prepare Q&A responses", Completed = false, Order = 3 }
                },
                Notes = "Important client meeting - need to impress!",
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddHours(-1)
            },

            // 3. Task with priority and due date - Show priority/due date
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Submit quarterly report",
                Category = "work",
                Completed = false,
                Source = "user",
                DueDate = DateTime.UtcNow.Date.AddHours(17), // 5 PM today
                Priority = "high",
                Notes = "Deadline is 5 PM today. Need to include Q3 metrics and projections.",
                EstimatedMinutes = 120,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },

            // 4. Task with recurrence - Show recurring task
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Morning meditation",
                Category = "health",
                Completed = true,
                Source = "user",
                Recurrence = new RecurrencePattern
                {
                    Type = "daily",
                    Interval = 1
                },
                CompletedAt = DateTime.UtcNow.AddHours(-3),
                Notes = "Daily mindfulness practice",
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddHours(-3)
            },

            // 5. Task with tags and reminders - Show advanced features
            new TaskEntity
            {
                UserId = userId,
                Date = today,
                Title = "Call dentist for appointment",
                Category = "health",
                Completed = false,
                Source = "user",
                Priority = "medium",
                Tags = new List<string> { "health", "appointment", "urgent" },
                Reminders = new List<Reminder>
                {
                    new Reminder
                    {
                        ReminderTime = DateTime.UtcNow.Date.AddHours(14), // 2 PM
                        Type = "notification",
                        Triggered = false
                    },
                    new Reminder
                    {
                        ReminderTime = DateTime.UtcNow.Date.AddHours(16), // 4 PM
                        Type = "notification",
                        Triggered = false
                    }
                },
                Notes = "Need to schedule checkup before end of month.",
                EstimatedMinutes = 15,
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        await _context.Tasks.InsertManyAsync(tasks);
        _logger.LogInformation("Seeded {Count} Tasks for user {UserId}", tasks.Count, userId);
    }
}
