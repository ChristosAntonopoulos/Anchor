using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Category;
using POS.Application.Services.Category;

namespace POS.Api.Controllers;

/// <summary>
/// Category endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Utilities")]
public class CategoryController : BaseController
{
    private readonly CategoryService _categoryService;

    public CategoryController(CategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>
    /// Get all active categories
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _categoryService.GetAllCategoriesAsync();
        return Success(categories);
    }

    /// <summary>
    /// Get category by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCategory(string id)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id);
        if (category == null)
        {
            return NotFound("Category not found");
        }
        return Success(category);
    }

    // Note: Create, Update, Delete endpoints are reserved for future admin implementation
}
