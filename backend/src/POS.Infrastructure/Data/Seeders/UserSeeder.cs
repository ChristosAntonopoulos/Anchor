using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds default user
/// </summary>
public class UserSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<UserSeeder> _logger;

    public UserSeeder(MongoDbContext context, ILogger<UserSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task SeedAsync(string userId)
    {
        _logger.LogInformation("Seeding user {UserId}", userId);

        // Query by UserId since Id is ObjectId and we're using string userId
        var existingUser = await _context.Users.Find(u => u.UserId == userId).FirstOrDefaultAsync();
        if (existingUser != null)
        {
            _logger.LogInformation("User {UserId} already exists, skipping", userId);
            return;
        }

        var user = new User
        {
            UserId = userId,
            Timezone = "UTC",
            CreatedAt = DateTime.UtcNow
        };
        // Note: Id will be auto-generated as ObjectId by MongoDB

        await _context.Users.InsertOneAsync(user);
        _logger.LogInformation("User {UserId} seeded successfully", userId);
    }
}
