using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Deadlines;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds Deadline (2 days from today to match mock data)
/// </summary>
public class DeadlineSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<DeadlineSeeder> _logger;

    public DeadlineSeeder(MongoDbContext context, ILogger<DeadlineSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        _logger.LogInformation("Seeding Deadline for user {UserId}", userId);

        var filter = Builders<Deadline>.Filter.Eq(d => d.UserId, userId);
        var existingDeadlines = await _context.Deadlines.Find(filter).ToListAsync();
        
        if (existingDeadlines.Any())
        {
            _logger.LogInformation("Deadlines already exist for user {UserId}, skipping", userId);
            return;
        }

        var deadlines = new List<Deadline>
        {
            new Deadline
            {
                UserId = userId,
                Title = "Q4 Product Launch",
                DueDate = DateTime.UtcNow.Date.AddDays(7),
                Status = DeadlineStatus.OnTrack,
                Importance = 5,
                CreatedAt = DateTime.UtcNow
            },
            new Deadline
            {
                UserId = userId,
                Title = "Client Proposal Submission",
                DueDate = DateTime.UtcNow.Date.AddDays(3),
                Status = DeadlineStatus.OnTrack,
                Importance = 4,
                CreatedAt = DateTime.UtcNow
            },
            new Deadline
            {
                UserId = userId,
                Title = "Monthly Report",
                DueDate = DateTime.UtcNow.Date.AddDays(1),
                Status = DeadlineStatus.Behind,
                Importance = 3,
                CreatedAt = DateTime.UtcNow
            }
        };

        await _context.Deadlines.InsertManyAsync(deadlines);
        _logger.LogInformation("Seeded {Count} Deadlines for user {UserId}", deadlines.Count, userId);
    }
}
