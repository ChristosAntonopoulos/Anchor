using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.WeeklyReview;
using POS.Infrastructure.Data;
using System.Globalization;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds Weekly Review for current week
/// </summary>
public class WeeklyReviewSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<WeeklyReviewSeeder> _logger;

    public WeeklyReviewSeeder(MongoDbContext context, ILogger<WeeklyReviewSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        _logger.LogInformation("Seeding Weekly Review for user {UserId}", userId);

        // Get current week ID (YYYY-WW format)
        var now = DateTime.UtcNow;
        var calendar = CultureInfo.CurrentCulture.Calendar;
        var weekOfYear = calendar.GetWeekOfYear(now, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
        var weekId = $"{now.Year}-{weekOfYear:D2}";

        var filter = Builders<WeeklyReview>.Filter.And(
            Builders<WeeklyReview>.Filter.Eq(wr => wr.UserId, userId),
            Builders<WeeklyReview>.Filter.Eq(wr => wr.WeekId, weekId)
        );

        var existingReview = await _context.WeeklyReviews.Find(filter).FirstOrDefaultAsync();
        if (existingReview != null)
        {
            _logger.LogInformation("Weekly Review already exists for user {UserId} week {WeekId}, skipping", userId, weekId);
            return;
        }

        var weeklyReview = new WeeklyReview
        {
            UserId = userId,
            WeekId = weekId,
            AiSummary = "You showed up most days but avoided leverage tasks.",
            Completed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.WeeklyReviews.InsertOneAsync(weeklyReview);
        _logger.LogInformation("Weekly Review seeded successfully for user {UserId} (WeekId: {WeekId})", 
            userId, weekId);
    }
}
