using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.WeeklyReview;
using POS.Application.Services.WeeklyReview;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Weekly review endpoints
/// </summary>
[ApiController]
[Route("api/weekly-review")]
[Tags("Weekly Review")]
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
    [ProducesResponseType(typeof(ApiResponse<WeeklyReviewDto>), StatusCodes.Status200OK)]
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
    [ProducesResponseType(typeof(ApiResponse<WeeklyReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitWeeklyReview([FromBody] SubmitWeeklyReviewRequest request)
    {
        var userId = GetUserId();
        var review = await _weeklyReviewService.SubmitWeeklyReviewAsync(request, userId);
        return Success(review);
    }

    /// <summary>
    /// Get weekly review by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<WeeklyReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetWeeklyReviewById(string id)
    {
        var userId = GetUserId();
        var review = await _weeklyReviewService.GetWeeklyReviewByIdAsync(id, userId);
        if (review == null)
        {
            return NotFound("Weekly review not found");
        }
        return Success(review);
    }

    /// <summary>
    /// Get weekly reviews by date range
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<WeeklyReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<WeeklyReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWeeklyReviewsByDateRange([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var userId = GetUserId();
        
        if (startDate.HasValue && endDate.HasValue)
        {
            var reviews = await _weeklyReviewService.GetWeeklyReviewsByDateRangeAsync(userId, startDate.Value, endDate.Value);
            return Success(reviews);
        }
        
        // If no date range provided, return current week's review (existing behavior)
        var review = await _weeklyReviewService.GetCurrentWeeklyReviewAsync(userId);
        return Success(review);
    }

    /// <summary>
    /// Update weekly review
    /// </summary>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(ApiResponse<WeeklyReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateWeeklyReview(string id, [FromBody] UpdateWeeklyReviewRequest request)
    {
        var userId = GetUserId();
        var review = await _weeklyReviewService.UpdateWeeklyReviewAsync(id, request, userId);
        if (review == null)
        {
            return NotFound("Weekly review not found");
        }
        return Success(review);
    }

    /// <summary>
    /// Delete weekly review
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteWeeklyReview(string id)
    {
        var userId = GetUserId();
        var deleted = await _weeklyReviewService.DeleteWeeklyReviewAsync(id, userId);
        if (!deleted)
        {
            return NotFound("Weekly review not found");
        }
        return Success("Weekly review deleted successfully");
    }
}
