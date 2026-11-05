using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Day;
using POS.Application.Services.Day;
using POS.Shared.Results;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/day")]
[Tags("Day")]
public class DayController : BaseController
{
    private readonly DayBootstrapService _dayBootstrapService;

    public DayController(DayBootstrapService dayBootstrapService)
    {
        _dayBootstrapService = dayBootstrapService;
    }

    [HttpGet("bootstrap-status")]
    [SwaggerOperation(OperationId = "Day_GetBootstrapStatus", Summary = "Poll day bootstrap / AI day-start status")]
    [ProducesResponseType(typeof(ApiResponse<DayBootstrapDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBootstrapStatus()
    {
        var userId = GetUserId();
        var status = await _dayBootstrapService.GetBootstrapStatusAsync(userId);
        return Success(status);
    }

    [HttpPost("assessment-seen")]
    [SwaggerOperation(OperationId = "Day_MarkAssessmentSeen", Summary = "Dismiss yesterday assessment popup")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAssessmentSeen()
    {
        var userId = GetUserId();
        await _dayBootstrapService.MarkAssessmentSeenAsync(userId);
        return Success();
    }
}
