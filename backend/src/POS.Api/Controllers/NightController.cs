using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Night;
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
