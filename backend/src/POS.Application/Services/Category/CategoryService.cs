using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Category;
using POS.Core.Entities;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Category;

/// <summary>
/// Service for managing categories
/// </summary>
public class CategoryService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(MongoDbContext context, IMapper mapper, ILogger<CategoryService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get all active categories (ordered by Order)
    /// </summary>
    public async Task<List<CategoryDto>> GetAllCategoriesAsync()
    {
        _logger.LogInformation("Getting all active categories");

        var filter = Builders<POS.Core.Entities.Category>.Filter.Eq(c => c.IsActive, true);
        var sort = Builders<POS.Core.Entities.Category>.Sort.Ascending(c => c.Order);

        var categories = await _context.Categories
            .Find(filter)
            .Sort(sort)
            .ToListAsync();

        return _mapper.Map<List<CategoryDto>>(categories);
    }

    /// <summary>
    /// Get category by ID
    /// </summary>
    public async Task<CategoryDto?> GetCategoryByIdAsync(string id)
    {
        _logger.LogInformation("Getting category {CategoryId}", id);

        var category = await _context.Categories
            .Find(c => c.Id == id && c.IsActive)
            .FirstOrDefaultAsync();

        return category != null ? _mapper.Map<CategoryDto>(category) : null;
    }

    /// <summary>
    /// Get category by name (for backward compatibility)
    /// </summary>
    public async Task<CategoryDto?> GetCategoryByNameAsync(string name)
    {
        _logger.LogInformation("Getting category by name {CategoryName}", name);

        var category = await _context.Categories
            .Find(c => c.Name == name && c.IsActive)
            .FirstOrDefaultAsync();

        return category != null ? _mapper.Map<CategoryDto>(category) : null;
    }

    /// <summary>
    /// Validate if category exists and is active
    /// </summary>
    public async Task<bool> ValidateCategoryAsync(string categoryName)
    {
        var category = await GetCategoryByNameAsync(categoryName);
        return category != null;
    }

    /// <summary>
    /// Create category (admin only - future implementation)
    /// </summary>
    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request, string userId)
    {
        _logger.LogInformation("Creating category {CategoryName} by user {UserId}", request.Name, userId);

        var category = _mapper.Map<POS.Core.Entities.Category>(request);
        category.UserId = string.Empty; // Global entity, no user association
        category.IsActive = true;
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.Categories.InsertOneAsync(category);

        return _mapper.Map<CategoryDto>(category);
    }

    /// <summary>
    /// Update category (admin only - future implementation)
    /// </summary>
    public async Task<CategoryDto?> UpdateCategoryAsync(string id, UpdateCategoryRequest request, string userId)
    {
        _logger.LogInformation("Updating category {CategoryId} by user {UserId}", id, userId);

        var filter = Builders<POS.Core.Entities.Category>.Filter.Eq(c => c.Id, id);
        var existingCategory = await _context.Categories.Find(filter).FirstOrDefaultAsync();

        if (existingCategory == null)
        {
            return null;
        }

        var updateBuilder = Builders<POS.Core.Entities.Category>.Update
            .Set(c => c.UpdatedAt, DateTime.UtcNow);

        if (request.Name != null) updateBuilder = updateBuilder.Set(c => c.Name, request.Name);
        if (request.DisplayName != null) updateBuilder = updateBuilder.Set(c => c.DisplayName, request.DisplayName);
        if (request.Color != null) updateBuilder = updateBuilder.Set(c => c.Color, request.Color);
        if (request.Icon != null) updateBuilder = updateBuilder.Set(c => c.Icon, request.Icon);
        if (request.Description != null) updateBuilder = updateBuilder.Set(c => c.Description, request.Description);
        if (request.Order.HasValue) updateBuilder = updateBuilder.Set(c => c.Order, request.Order.Value);
        if (request.IsActive.HasValue) updateBuilder = updateBuilder.Set(c => c.IsActive, request.IsActive.Value);

        await _context.Categories.UpdateOneAsync(filter, updateBuilder);

        var updatedCategory = await _context.Categories.Find(filter).FirstOrDefaultAsync();
        return updatedCategory != null ? _mapper.Map<CategoryDto>(updatedCategory) : null;
    }

    /// <summary>
    /// Delete category (soft delete - admin only)
    /// </summary>
    public async Task<bool> DeleteCategoryAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting category {CategoryId} by user {UserId}", id, userId);

        var filter = Builders<POS.Core.Entities.Category>.Filter.Eq(c => c.Id, id);
        var update = Builders<POS.Core.Entities.Category>.Update
            .Set(c => c.IsActive, false)
            .Set(c => c.UpdatedAt, DateTime.UtcNow);

        var result = await _context.Categories.UpdateOneAsync(filter, update);
        return result.MatchedCount > 0;
    }
}
