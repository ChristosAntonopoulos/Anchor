using Microsoft.AspNetCore.Mvc;
using POS.Application.Services.AIBrief;

namespace POS.Api.Controllers;

/// <summary>
/// Surfaces the AI-generated daily brief produced by BotSystem's anchor.day-start bot.
/// </summary>
[ApiController]
[Route("api/ai-brief")]
public class AIBriefController : BaseController
{
    private readonly DayStartPlanService _dayStartPlanService;

    public AIBriefController(DayStartPlanService dayStartPlanService)
    {
        _dayStartPlanService = dayStartPlanService;
    }

    /// <summary>
    /// Returns today's AI brief. Returns 204 when the bot has not yet run today.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTodayBrief()
    {
        var userId = GetUserId();
        var brief = await _dayStartPlanService.GetTodayBriefAsync(userId);
        return brief is null ? NoContent() : Success(brief);
    }

    /// <summary>
    /// Marks today's brief as applied (the user has acted on it).
    /// </summary>
    [HttpPost("applied")]
    public async Task<IActionResult> MarkApplied()
    {
        var userId = GetUserId();
        await _dayStartPlanService.MarkAppliedAsync(userId);
        return Success();
    }
}
