using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Morning;
using POS.Application.Services.Morning;
using POS.Shared.Results;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/morning")]
[Tags("Morning")]
public class MorningController : BaseController
{
    private readonly MorningModeService _morning;

    public MorningController(MorningModeService morning)
    {
        _morning = morning;
    }

    [HttpPut("session")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpsertSession([FromBody] JsonElement payload, CancellationToken ct)
    {
        await _morning.UpsertSessionAsync(GetUserId(), payload, ct);
        return Success("Saved");
    }

    [HttpGet("first-task")]
    [ProducesResponseType(typeof(ApiResponse<MorningFirstTaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> FirstTask(CancellationToken ct)
    {
        return Success(await _morning.FirstTaskAsync(GetUserId(), ct));
    }

    [HttpPost("help")]
    [ProducesResponseType(typeof(ApiResponse<MorningHelpDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Help([FromBody] MorningHelpRequest request, CancellationToken ct)
    {
        return Success(await _morning.HelpAsync(GetUserId(), request, ct));
    }
}
