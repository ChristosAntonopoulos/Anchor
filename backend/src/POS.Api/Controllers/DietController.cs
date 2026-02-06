using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Diet;
using POS.Application.Services.Diet;

namespace POS.Api.Controllers;

/// <summary>
/// Diet endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DietController : BaseController
{
    private readonly DietService _dietService;

    public DietController(DietService dietService)
    {
        _dietService = dietService;
    }

    /// <summary>
    /// Get today's diet entry
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDiet()
    {
        var userId = GetUserId();
        var diet = await _dietService.GetTodayDietAsync(userId);
        return Success(diet);
    }

    /// <summary>
    /// Update today's diet entry
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateDiet([FromBody] UpdateDietRequest request)
    {
        var userId = GetUserId();
        var diet = await _dietService.UpdateDietAsync(request, userId);
        return Success(diet);
    }
}
