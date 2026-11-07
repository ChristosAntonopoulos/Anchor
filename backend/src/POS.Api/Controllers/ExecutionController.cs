using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Execution;
using POS.Application.Services.Execution;
using POS.Core.Exceptions;
using POS.Shared.Results;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/execution")]
[Tags("Execution")]
public class ExecutionController : BaseController
{
    private readonly ExecutionService _execution;

    public ExecutionController(ExecutionService execution)
    {
        _execution = execution;
    }

    [HttpGet("profile")]
    [ProducesResponseType(typeof(ApiResponse<ExecutionProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        return Success(await _execution.GetProfileAsync(GetUserId(), ct));
    }

    [HttpPut("profile")]
    [ProducesResponseType(typeof(ApiResponse<ExecutionProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateExecutionProfileRequest request, CancellationToken ct)
    {
        return Success(await _execution.UpdateProfileAsync(GetUserId(), request, ct));
    }

    [HttpGet("now")]
    [ProducesResponseType(typeof(ApiResponse<NowRecommendationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNow([FromQuery] string? capacity, [FromQuery] bool easier = false, [FromQuery] bool refresh = false, CancellationToken ct = default)
    {
        return Success(await _execution.GetNowAsync(GetUserId(), new NowRequest
        {
            Capacity = capacity,
            EasierStart = easier,
            Refresh = refresh,
        }, ct));
    }

    [HttpPost("now/reject")]
    public async Task<IActionResult> RejectNow([FromBody] RejectNowRequest request, CancellationToken ct)
    {
        await _execution.RejectNowAsync(GetUserId(), request, ct);
        return Success("Suggestion dismissed");
    }

    [HttpGet("sessions/active")]
    [ProducesResponseType(typeof(ApiResponse<WorkSessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActiveSession(CancellationToken ct)
    {
        var session = await _execution.GetActiveSessionAsync(GetUserId(), ct);
        return Success(session);
    }

    [HttpPost("sessions/start")]
    [ProducesResponseType(typeof(ApiResponse<WorkSessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Start([FromBody] StartSessionRequest request, CancellationToken ct)
    {
        try
        {
            return Success(await _execution.StartSessionAsync(GetUserId(), request, ct));
        }
        catch (NotFoundException)
        {
            return NotFound("Task or block was not found");
        }
    }

    [HttpPost("sessions/{id}/pause")]
    public async Task<IActionResult> Pause(string id, CancellationToken ct)
    {
        return Success(await _execution.PauseSessionAsync(GetUserId(), id, ct));
    }

    [HttpPost("sessions/{id}/resume")]
    public async Task<IActionResult> Resume(string id, CancellationToken ct)
    {
        return Success(await _execution.ResumeSessionAsync(GetUserId(), id, ct));
    }

    [HttpPost("sessions/{id}/time-check")]
    public async Task<IActionResult> TimeCheck(string id, CancellationToken ct)
    {
        return Success(await _execution.TimeCheckAsync(GetUserId(), id, ct));
    }

    [HttpPost("sessions/{id}/distraction")]
    public async Task<IActionResult> Distraction(string id, [FromBody] DistractionRequest request, CancellationToken ct)
    {
        return Success(await _execution.CaptureDistractionAsync(GetUserId(), id, request, ct));
    }

    [HttpPost("sessions/{id}/finish")]
    public async Task<IActionResult> Finish(string id, [FromBody] FinishSessionRequest request, CancellationToken ct)
    {
        return Success(await _execution.FinishSessionAsync(GetUserId(), id, request, ct));
    }

    [HttpPost("sessions/{id}/return-point")]
    public async Task<IActionResult> ReturnPoint(string id, [FromBody] ReturnPointRequest request, CancellationToken ct)
    {
        request.SessionId = id;
        return Success(await _execution.DraftReturnPointAsync(GetUserId(), request, ct));
    }

    [HttpPost("tasks/{id}/plan")]
    public async Task<IActionResult> PlanTask(string id, CancellationToken ct)
    {
        return Success(await _execution.PlanTaskAsync(GetUserId(), id, ct));
    }

    [HttpPost("tasks/{id}/plan/accept")]
    public async Task<IActionResult> AcceptPlan(string id, [FromBody] AcceptTaskPlanRequest request, CancellationToken ct)
    {
        return Success(await _execution.AcceptTaskPlanAsync(GetUserId(), id, request, ct));
    }

    [HttpPost("stuck")]
    public async Task<IActionResult> Stuck([FromBody] StuckRequest request, CancellationToken ct)
    {
        return Success(await _execution.HelpStuckAsync(GetUserId(), request, ct));
    }

    [HttpPost("stuck/accept")]
    public async Task<IActionResult> AcceptStuck([FromBody] AcceptStuckRequest request, CancellationToken ct)
    {
        return Success(await _execution.AcceptStuckAsync(GetUserId(), request, ct));
    }

    [HttpPost("day-plan")]
    public async Task<IActionResult> DayPlan([FromBody] DayPlanRequest request, CancellationToken ct)
    {
        return Success(await _execution.PlanDayAsync(GetUserId(), request, ct));
    }

    [HttpPost("day-plan/apply")]
    public async Task<IActionResult> ApplyDayPlan([FromBody] ApplyDayPlanRequest request, CancellationToken ct)
    {
        return Success(await _execution.ApplyDayPlanAsync(GetUserId(), request, ct));
    }

    [HttpPost("recovery")]
    public async Task<IActionResult> Recovery([FromBody] RecoveryActionRequest request, CancellationToken ct)
    {
        return Success(await _execution.RecoveryActionAsync(GetUserId(), request, ct));
    }

    [HttpPost("routines/adapt")]
    public async Task<IActionResult> AdaptRoutine([FromBody] AdaptRoutineRequest request, CancellationToken ct)
    {
        return Success(await _execution.AdaptRoutineAsync(GetUserId(), request, ct));
    }

    [HttpPost("routines/{blockId}/version")]
    public async Task<IActionResult> RoutineVersion(string blockId, [FromBody] SetRoutineVersionRequest request, CancellationToken ct)
    {
        var block = await _execution.SetRoutineVersionAsync(GetUserId(), blockId, request.Version, ct);
        return Success(block);
    }

    [HttpPost("routines/{blockId}/skip")]
    public async Task<IActionResult> SkipRoutine(string blockId, CancellationToken ct)
    {
        var block = await _execution.SkipRoutineAsync(GetUserId(), blockId, ct);
        return Success(block);
    }

    [HttpGet("review")]
    public async Task<IActionResult> Review(CancellationToken ct)
    {
        return Success(await _execution.ReviewAsync(GetUserId(), ct));
    }
}
