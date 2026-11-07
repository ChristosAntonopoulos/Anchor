using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds default categories
/// </summary>
public class CategorySeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<CategorySeeder> _logger;

    public CategorySeeder(MongoDbContext context, ILogger<CategorySeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task SeedAsync()
    {
        _logger.LogInformation("Seeding Categories");

        var existingCategories = await _context.Categories.Find(_ => true).ToListAsync();
        if (existingCategories.Any())
        {
            _logger.LogInformation("Categories already exist, skipping seed");
            return;
        }

        var categories = new List<Category>
        {
            new Category
            {
                Name = "work",
                DisplayName = "Work",
                Color = "#00D9FF",
                Order = 1,
                IsActive = true,
                UserId = string.Empty, // Global entity
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Category
            {
                Name = "leverage",
                DisplayName = "Leverage",
                Color = "#10D9A0",
                Order = 2,
                IsActive = true,
                UserId = string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Category
            {
                Name = "health",
                DisplayName = "Health",
                Color = "#FFB84D",
                Order = 3,
                IsActive = true,
                UserId = string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Category
            {
                Name = "stability",
                DisplayName = "Stability",
                Color = "#A78BFA",
                Order = 4,
                IsActive = true,
                UserId = string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        await _context.Categories.InsertManyAsync(categories);
        _logger.LogInformation("Seeded {Count} Categories", categories.Count);
    }
}
