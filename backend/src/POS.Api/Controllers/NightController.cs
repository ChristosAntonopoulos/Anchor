using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Night;
using POS.Application.DTOs.Routine;
using POS.Application.Services.Night;
using POS.Shared.Results;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/night")]
[Tags("Night")]
public class NightController : BaseController
{
    private readonly NightModeService _night;

    public NightController(NightModeService night)
    {
        _night = night;
    }

    /// <summary>
    /// Returns the stored night session for a local date, or a clear waiting shell
    /// plus the unified night routine (never an empty body).
    /// </summary>
    [HttpGet("session")]
    [ProducesResponseType(typeof(ApiResponse<ModeSessionResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSession(
        [FromQuery] string? localDate,
        [FromQuery] string? timezone,
        CancellationToken ct)
    {
        return Success(await _night.GetSessionAsync(GetUserId(), localDate, timezone, ct));
    }

    [HttpPut("session")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpsertSession([FromBody] JsonElement payload, CancellationToken ct)
    {
        await _night.UpsertSessionAsync(GetUserId(), payload, ct);
        return Success("Saved");
    }

    [HttpGet("tomorrow-plan")]
    [ProducesResponseType(typeof(ApiResponse<NightTomorrowPlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> TomorrowPlan(CancellationToken ct)
    {
        return Success(await _night.TomorrowPlanAsync(GetUserId(), ct));
    }

    [HttpPost("help")]
    [ProducesResponseType(typeof(ApiResponse<NightHelpDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Help([FromBody] NightHelpRequest request, CancellationToken ct)
    {
        return Success(await _night.HelpAsync(GetUserId(), request, ct));
    }
}
