using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.CBT;
using POS.Application.Services.CBT;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// CBT endpoints
/// </summary>
[ApiController]
[Route("api/cbt")]
public class CBTController : BaseController
{
    private readonly CBTService _cbtService;

    public CBTController(CBTService cbtService)
    {
        _cbtService = cbtService;
    }

    /// <summary>
    /// Submit CBT text input for AI processing
    /// </summary>
    [HttpPost("entries")]
    public async Task<IActionResult> SubmitCBTEntry([FromBody] CreateCBTEntryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return ValidationError(new List<ErrorDetail>
            {
                new ErrorDetail { Field = "text", Message = "Text is required" }
            });
        }

        var userId = GetUserId();
        var entry = await _cbtService.SubmitCBTEntryAsync(request, userId);
        return Success(entry, "CBT entry submitted for AI processing");
    }

    /// <summary>
    /// Get all CBT entries (optionally filtered by date)
    /// </summary>
    [HttpGet("entries")]
    public async Task<IActionResult> GetCBTEntries([FromQuery] DateTime? date = null)
    {
        var userId = GetUserId();
        var entries = await _cbtService.GetCBTEntriesAsync(userId, date);
        return Success(entries);
    }

    /// <summary>
    /// Get single CBT entry by ID
    /// </summary>
    [HttpGet("entries/{id}")]
    public async Task<IActionResult> GetCBTEntry(string id)
    {
        var userId = GetUserId();
        var entry = await _cbtService.GetCBTEntryByIdAsync(id, userId);
        if (entry == null)
        {
            return NotFound("CBT entry not found");
        }
        return Success(entry);
    }

    /// <summary>
    /// Update CBT entry (for manual edits)
    /// </summary>
    [HttpPatch("entries/{id}")]
    public async Task<IActionResult> UpdateCBTEntry(string id, [FromBody] UpdateCBTEntryRequest request)
    {
        var userId = GetUserId();
        var entry = await _cbtService.UpdateCBTEntryAsync(id, request, userId);
        if (entry == null)
        {
            return NotFound("CBT entry not found");
        }
        return Success(entry);
    }

    /// <summary>
    /// Delete CBT entry
    /// </summary>
    [HttpDelete("entries/{id}")]
    public async Task<IActionResult> DeleteCBTEntry(string id)
    {
        var userId = GetUserId();
        var deleted = await _cbtService.DeleteCBTEntryAsync(id, userId);
        if (deleted)
        {
            return Success("CBT entry deleted successfully");
        }
        return NotFound("CBT entry not found");
    }

    /// <summary>
    /// Get mood entries for date range
    /// </summary>
    [HttpGet("moods")]
    public async Task<IActionResult> GetMoodEntries([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var userId = GetUserId();
        var entries = await _cbtService.GetMoodEntriesAsync(userId, startDate, endDate);
        return Success(entries);
    }

    /// <summary>
    /// Create mood entry
    /// </summary>
    [HttpPost("moods")]
    public async Task<IActionResult> CreateMoodEntry([FromBody] CreateMoodEntryRequest request)
    {
        var userId = GetUserId();
        var entry = await _cbtService.CreateMoodEntryAsync(request, userId);
        return Success(entry, "Mood entry created successfully");
    }

    /// <summary>
    /// Get behavioral activities (optionally filtered by date)
    /// </summary>
    [HttpGet("activities")]
    public async Task<IActionResult> GetBehavioralActivities([FromQuery] DateTime? date = null)
    {
        var userId = GetUserId();
        var activities = await _cbtService.GetBehavioralActivitiesAsync(userId, date);
        return Success(activities);
    }

    /// <summary>
    /// Create behavioral activity
    /// </summary>
    [HttpPost("activities")]
    public async Task<IActionResult> CreateBehavioralActivity([FromBody] CreateBehavioralActivityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return ValidationError(new List<ErrorDetail>
            {
                new ErrorDetail { Field = "title", Message = "Title is required" }
            });
        }

        var userId = GetUserId();
        var activity = await _cbtService.CreateBehavioralActivityAsync(request, userId);
        return Success(activity, "Behavioral activity created successfully");
    }

    /// <summary>
    /// Update behavioral activity
    /// </summary>
    [HttpPatch("activities/{id}")]
    public async Task<IActionResult> UpdateBehavioralActivity(string id, [FromBody] UpdateBehavioralActivityRequest request)
    {
        var userId = GetUserId();
        var activity = await _cbtService.UpdateBehavioralActivityAsync(id, request, userId);
        if (activity == null)
        {
            return NotFound("Behavioral activity not found");
        }
        return Success(activity);
    }

    /// <summary>
    /// Complete behavioral activity with ratings
    /// </summary>
    [HttpPost("activities/{id}/complete")]
    public async Task<IActionResult> CompleteBehavioralActivity(string id, [FromBody] CompleteBehavioralActivityRequest request)
    {
        var userId = GetUserId();
        var activity = await _cbtService.CompleteBehavioralActivityAsync(id, request, userId);
        if (activity == null)
        {
            return NotFound("Behavioral activity not found");
        }
        return Success(activity, "Activity completed successfully");
    }
}
