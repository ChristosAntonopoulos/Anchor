using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.WeeklyReview;
using POS.Application.Services.WeeklyReview;

namespace POS.Api.Controllers;

/// <summary>
/// Weekly review endpoints
/// </summary>
[ApiController]
[Route("api/weekly-review")]
public class WeeklyReviewController : BaseController
{
    private readonly WeeklyReviewService _weeklyReviewService;

    public WeeklyReviewController(WeeklyReviewService weeklyReviewService)
    {
        _weeklyReviewService = weeklyReviewService;
    }

    /// <summary>
    /// Get current weekly review
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetWeeklyReview()
    {
        var userId = GetUserId();
        var review = await _weeklyReviewService.GetCurrentWeeklyReviewAsync(userId);
        return Success(review);
    }

    /// <summary>
    /// Submit weekly review answers
    /// </summary>
    [HttpPost("submit")]
    public async Task<IActionResult> SubmitWeeklyReview([FromBody] SubmitWeeklyReviewRequest request)
    {
        var userId = GetUserId();
        var review = await _weeklyReviewService.SubmitWeeklyReviewAsync(request, userId);
        return Success(review);
    }
}
