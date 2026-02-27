using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Category;
using POS.Application.Services.Category;
using POS.Shared.Results;

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
    [SwaggerOperation(OperationId = "Categories_GetCategories", Summary = "Get all active categories")]
    [ProducesResponseType(typeof(ApiResponse<List<CategoryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _categoryService.GetAllCategoriesAsync();
        return Success(categories);
    }

    /// <summary>
    /// Get category by ID
    /// </summary>
    [HttpGet("{id}")]
    [SwaggerOperation(OperationId = "Categories_GetCategory", Summary = "Get category by ID")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
