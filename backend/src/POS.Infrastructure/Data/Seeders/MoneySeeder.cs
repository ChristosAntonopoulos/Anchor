using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Money;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds Income Entry (6 days ago to match mock data)
/// </summary>
public class MoneySeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<MoneySeeder> _logger;

    public MoneySeeder(MongoDbContext context, ILogger<MoneySeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        _logger.LogInformation("Seeding Income Entry for user {UserId}", userId);

        // Check if any income entries exist for this user
        var filter = Builders<IncomeEntry>.Filter.Eq(i => i.UserId, userId);
        var existingEntries = await _context.IncomeEntries.Find(filter).ToListAsync();
        
        if (existingEntries.Any())
        {
            _logger.LogInformation("Income Entries already exist for user {UserId}, skipping", userId);
            return;
        }

        // Seed income entry from 6 days ago (to match mock data: daysSinceLastIncome: 6)
        var incomeDate = DateTime.UtcNow.Date.AddDays(-6);
        var incomeEntry = new IncomeEntry
        {
            UserId = userId,
            Date = incomeDate,
            Source = "Client A",
            Amount = 420,
            Currency = "USD",
            CreatedAt = DateTime.UtcNow
        };

        await _context.IncomeEntries.InsertOneAsync(incomeEntry);
        _logger.LogInformation("Income Entry seeded successfully for user {UserId} (Date: {Date}, Amount: {Amount})", 
            userId, incomeDate, incomeEntry.Amount);
    }
}
