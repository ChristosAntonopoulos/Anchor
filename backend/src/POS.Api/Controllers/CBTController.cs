using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.CBT;
using POS.Application.Services.CBT;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// CBT endpoints
/// </summary>
[ApiController]
[Route("api/cbt")]
[Tags("CBT")]
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
    /// <param name="request">CBT entry request. Text is required.</param>
    /// <returns>CBT entry with AI-processed insights</returns>
    /// <remarks>
    /// Submits text input for AI processing to extract automatic thoughts, cognitive distortions, and behavioral patterns.
    /// Example request:
    /// <code>
    /// {
    ///   "text": "I feel anxious about the presentation tomorrow. I'm probably going to mess it up."
    /// }
    /// </code>
    /// </remarks>
    /// <response code="200">CBT entry submitted and processed successfully</response>
    /// <response code="400">Validation error - text is required</response>
    [HttpPost("entries")]
    [SwaggerOperation(OperationId = "CBT_SubmitEntry", Summary = "Submit CBT text input for AI processing")]
    [ProducesResponseType(typeof(ApiResponse<CBTEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    /// Get all CBT entries, optionally filtered by date
    /// </summary>
    /// <param name="date">Filter by specific date (optional). Format: ISO 8601 date</param>
    /// <returns>List of CBT entries, ordered by most recent first</returns>
    /// <remarks>
    /// If no date is provided, returns all CBT entries for the current user.
    /// </remarks>
    /// <response code="200">List of CBT entries retrieved successfully</response>
    [HttpGet("entries")]
    [SwaggerOperation(OperationId = "CBT_GetEntries", Summary = "Get all CBT entries")]
    [ProducesResponseType(typeof(ApiResponse<List<CBTEntryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetCBTEntries([FromQuery] DateTime? date = null)
    {
        var userId = GetUserId();
        var entries = await _cbtService.GetCBTEntriesAsync(userId, date);
        return Success(entries);
    }

    /// <summary>
    /// Get a single CBT entry by ID
    /// </summary>
    /// <param name="id">CBT entry ID</param>
    /// <returns>CBT entry with full details</returns>
    /// <response code="200">CBT entry retrieved successfully</response>
    /// <response code="404">CBT entry not found</response>
    [HttpGet("entries/{id}")]
    [ProducesResponseType(typeof(ApiResponse<CBTEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    [ProducesResponseType(typeof(ApiResponse<CBTEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    [ProducesResponseType(typeof(ApiResponse<List<MoodEntryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    [ProducesResponseType(typeof(ApiResponse<MoodEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    [ProducesResponseType(typeof(ApiResponse<List<BehavioralActivityDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    [ProducesResponseType(typeof(ApiResponse<BehavioralActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    [ProducesResponseType(typeof(ApiResponse<BehavioralActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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
    [ProducesResponseType(typeof(ApiResponse<BehavioralActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
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

    /// <summary>
    /// Get behavioral activity by ID
    /// </summary>
    [HttpGet("activities/{id}")]
    [ProducesResponseType(typeof(ApiResponse<BehavioralActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetBehavioralActivityById(string id)
    {
        var userId = GetUserId();
        var activity = await _cbtService.GetBehavioralActivityByIdAsync(id, userId);
        if (activity == null)
        {
            return NotFound("Behavioral activity not found");
        }
        return Success(activity);
    }

    /// <summary>
    /// Delete behavioral activity
    /// </summary>
    [HttpDelete("activities/{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteBehavioralActivity(string id)
    {
        var userId = GetUserId();
        var deleted = await _cbtService.DeleteBehavioralActivityAsync(id, userId);
        if (!deleted)
        {
            return NotFound("Behavioral activity not found");
        }
        return Success("Behavioral activity deleted successfully");
    }

    /// <summary>
    /// Get mood entry by ID
    /// </summary>
    [HttpGet("moods/{id}")]
    [ProducesResponseType(typeof(ApiResponse<MoodEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetMoodEntryById(string id)
    {
        var userId = GetUserId();
        var mood = await _cbtService.GetMoodEntryByIdAsync(id, userId);
        if (mood == null)
        {
            return NotFound("Mood entry not found");
        }
        return Success(mood);
    }

    /// <summary>
    /// Update mood entry
    /// </summary>
    [HttpPatch("moods/{id}")]
    [ProducesResponseType(typeof(ApiResponse<MoodEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateMoodEntry(string id, [FromBody] UpdateMoodEntryRequest request)
    {
        var userId = GetUserId();
        var mood = await _cbtService.UpdateMoodEntryAsync(id, request, userId);
        if (mood == null)
        {
            return NotFound("Mood entry not found");
        }
        return Success(mood);
    }

    /// <summary>
    /// Delete mood entry
    /// </summary>
    [HttpDelete("moods/{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteMoodEntry(string id)
    {
        var userId = GetUserId();
        var deleted = await _cbtService.DeleteMoodEntryAsync(id, userId);
        if (!deleted)
        {
            return NotFound("Mood entry not found");
        }
        return Success("Mood entry deleted successfully");
    }
}
