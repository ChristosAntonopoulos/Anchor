using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Constants;
using POS.Core.Entities;
using POS.Core.Entities.BetterToday;
using POS.Core.Entities.Deadlines;
using POS.Core.Entities.Diet;
using POS.Core.Entities.Discipline;
using POS.Core.Entities.Money;
using POS.Core.Entities.Schedule;
using POS.Core.Entities.Tasks;
using POS.Core.Entities.WeeklyReview;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Main database seeder - orchestrates all seeders
/// </summary>
public class DataSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<DataSeeder> _logger;
    private readonly ILoggerFactory _loggerFactory;

    public DataSeeder(MongoDbContext context, ILogger<DataSeeder> logger, ILoggerFactory loggerFactory)
    {
        _context = context;
        _logger = logger;
        _loggerFactory = loggerFactory;
    }

    /// <summary>
    /// Delete all existing data for the user (in reverse dependency order)
    /// </summary>
    public async System.Threading.Tasks.Task DeleteAllDataAsync(string? userId = null)
    {
        userId ??= AppConstants.DefaultUserId;
        _logger.LogInformation("Deleting all existing data for user {UserId}", userId);

        try
        {
            // Delete in reverse dependency order
            var userFilter = Builders<EntityBase>.Filter.Eq("userId", userId);

            // WeeklyReview
            await _context.WeeklyReviews.DeleteManyAsync(Builders<WeeklyReview>.Filter.Eq(wr => wr.UserId, userId));
            
            // Deadline
            await _context.Deadlines.DeleteManyAsync(Builders<Deadline>.Filter.Eq(d => d.UserId, userId));
            
            // Money (IncomeEntry)
            await _context.IncomeEntries.DeleteManyAsync(Builders<IncomeEntry>.Filter.Eq(i => i.UserId, userId));
            
            // Diet
            await _context.DietEntries.DeleteManyAsync(Builders<DietEntry>.Filter.Eq(d => d.UserId, userId));
            
            // Discipline
            await _context.DisciplineEntries.DeleteManyAsync(Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId));
            
            // Schedule (ScheduleBlockInstance)
            await _context.ScheduleBlockInstances.DeleteManyAsync(Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId));
            
            // Task
            await _context.Tasks.DeleteManyAsync(Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.UserId, userId));
            
            // BetterItem
            await _context.BetterItems.DeleteManyAsync(Builders<BetterItem>.Filter.Eq(bi => bi.UserId, userId));
            
            // Day
            await _context.Days.DeleteManyAsync(Builders<Day>.Filter.Eq(d => d.UserId, userId));
            
            // User (last) - query by UserId since Id is ObjectId
            await _context.Users.DeleteManyAsync(Builders<User>.Filter.Eq(u => u.UserId, userId));

            _logger.LogInformation("All existing data deleted for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting existing data for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Seed all initial data for the default user
    /// </summary>
    public async System.Threading.Tasks.Task SeedAsync(string? userId = null)
    {
        userId ??= AppConstants.DefaultUserId;
        _logger.LogInformation("Starting database seeding for user {UserId}", userId);

        try
        {
            // Delete all existing data first
            await DeleteAllDataAsync(userId);

            // Seed in order (dependencies first)
            await new UserSeeder(_context, _loggerFactory.CreateLogger<UserSeeder>()).SeedAsync(userId);
            await new DaySeeder(_context, _loggerFactory.CreateLogger<DaySeeder>()).SeedAsync(userId);
            await new BetterItemSeeder(_context, _loggerFactory.CreateLogger<BetterItemSeeder>()).SeedAsync(userId);
            await new TaskSeeder(_context, _loggerFactory.CreateLogger<TaskSeeder>()).SeedAsync(userId);
            await new ScheduleSeeder(_context, _loggerFactory.CreateLogger<ScheduleSeeder>()).SeedAsync(userId);
            await new DisciplineSeeder(_context, _loggerFactory.CreateLogger<DisciplineSeeder>()).SeedAsync(userId);
            await new DietSeeder(_context, _loggerFactory.CreateLogger<DietSeeder>()).SeedAsync(userId);
            await new MoneySeeder(_context, _loggerFactory.CreateLogger<MoneySeeder>()).SeedAsync(userId);
            await new DeadlineSeeder(_context, _loggerFactory.CreateLogger<DeadlineSeeder>()).SeedAsync(userId);
            await new WeeklyReviewSeeder(_context, _loggerFactory.CreateLogger<WeeklyReviewSeeder>()).SeedAsync(userId);

            _logger.LogInformation("Database seeding completed successfully for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during database seeding for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Check if database has been seeded (checks if user exists and has data)
    /// </summary>
    public async System.Threading.Tasks.Task<bool> IsSeededAsync(string? userId = null)
    {
        userId ??= AppConstants.DefaultUserId;
        
        // Check if user exists (query by UserId since Id is ObjectId)
        var user = await _context.Users.Find(u => u.UserId == userId).FirstOrDefaultAsync();
        if (user == null)
        {
            return false;
        }

        // Check if there's actual data (not just the user)
        // Check for Better Items, Tasks, or Schedule blocks (any one indicates data exists)
        var today = DateTime.UtcNow.Date;
        
        var hasBetterItems = await _context.BetterItems
            .Find(bi => bi.UserId == userId && bi.Date == today)
            .AnyAsync();
            
        var hasTasks = await _context.Tasks
            .Find(t => t.UserId == userId && t.Date == today)
            .AnyAsync();
            
        var hasSchedule = await _context.ScheduleBlockInstances
            .Find(sb => sb.UserId == userId && sb.Date == today)
            .AnyAsync();

        // If any of these exist, database is seeded
        return hasBetterItems || hasTasks || hasSchedule;
    }
}
