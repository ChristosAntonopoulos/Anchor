using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Today;
using POS.Application.Services.Today;

namespace POS.Api.Controllers;

/// <summary>
/// Today endpoint - aggregates all daily data
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TodayController : BaseController
{
    private readonly TodayService _todayService;

    public TodayController(TodayService todayService)
    {
        _todayService = todayService;
    }

    /// <summary>
    /// Get today's aggregated data
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetToday()
    {
        var userId = GetUserId();
        var todayData = await _todayService.GetTodayAsync(userId);
        return Success(todayData);
    }
}
