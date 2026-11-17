using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Assistant;
using POS.Application.DTOs.BetterToday;
using POS.Application.DTOs.Discipline;
using POS.Application.DTOs.Execution;
using POS.Application.DTOs.Routine;
using POS.Application.DTOs.Schedule;
using POS.Application.DTOs.Tasks;
using POS.Application.Services.Assistant;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// External assistant write API. Requires header X-Anchor-Key when AnchorApi:Key is configured.
/// </summary>
[ApiController]
[Route("api/assistant")]
[Tags("Assistant")]
public class AssistantController : BaseController
{
    private readonly AssistantWriteService _assistant;

    public AssistantController(AssistantWriteService assistant)
    {
        _assistant = assistant;
    }

    // ── Tasks ─────────────────────────────────────────────────────────────

    [HttpPost("tasks")]
    [SwaggerOperation(OperationId = "Assistant_CreateTask", Summary = "Create task / inbox item",
        Description = "Requires X-Anchor-Key. Default status is inbox; set status=today for the focus list.")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateTask([FromBody] AssistantCreateTaskRequest request)
    {
        try
        {
            return Success(await _assistant.CreateTaskAsync(request, GetUserId()), "Task created");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("tasks/{id}")]
    [SwaggerOperation(OperationId = "Assistant_UpdateTask", Summary = "Update a task",
        Description = "Requires X-Anchor-Key. Partial update.")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateTask(string id, [FromBody] AssistantUpdateTaskRequest request)
    {
        try
        {
            return Success(await _assistant.UpdateTaskAsync(id, request, GetUserId()), "Task updated");
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException or POS.Core.Exceptions.NotFoundException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("tasks/{id}")]
    [SwaggerOperation(OperationId = "Assistant_DeleteTask", Summary = "Delete a task",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteTask(string id)
    {
        var ok = await _assistant.DeleteTaskAsync(id, GetUserId());
        return ok ? Success("Task deleted") : NotFound("Task not found");
    }

    // ── Discipline check (existing) ───────────────────────────────────────

    [HttpPost("discipline/check")]
    [SwaggerOperation(OperationId = "Assistant_CheckDiscipline", Summary = "Check off a discipline habit for today",
        Description = "Requires X-Anchor-Key. Match by itemId or itemName. Toggles set checked (default true); counters increment by 1.")]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckDiscipline([FromBody] AssistantCheckDisciplineRequest request)
    {
        try
        {
            return Success(await _assistant.CheckDisciplineAsync(request, GetUserId()), "Discipline updated");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // ── Habits ────────────────────────────────────────────────────────────

    [HttpGet("habits")]
    [SwaggerOperation(OperationId = "Assistant_ListHabits", Summary = "List habit definitions",
        Description = "Requires X-Anchor-Key. Seeds defaults only if missing.")]
    [ProducesResponseType(typeof(ApiResponse<List<AssistantHabitDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ListHabits() =>
        Success(await _assistant.ListHabitsAsync(GetUserId()));

    [HttpPost("habits")]
    [SwaggerOperation(OperationId = "Assistant_UpsertHabit", Summary = "Create or upsert a habit by itemId",
        Description = "Requires X-Anchor-Key. Supports active/pause and daysOfWeek (0=Sun…6=Sat). Coffee/Cigarettes are protected.")]
    [ProducesResponseType(typeof(ApiResponse<AssistantHabitDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpsertHabit([FromBody] AssistantHabitUpsertRequest request)
    {
        try
        {
            return Success(await _assistant.UpsertHabitAsync(request, GetUserId()), "Habit upserted");
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("habits/{itemId}")]
    [SwaggerOperation(OperationId = "Assistant_PatchHabit", Summary = "Patch a habit",
        Description = "Requires X-Anchor-Key. Set active=false to pause.")]
    [ProducesResponseType(typeof(ApiResponse<AssistantHabitDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PatchHabit(string itemId, [FromBody] AssistantHabitPatchRequest request)
    {
        try
        {
            return Success(await _assistant.PatchHabitAsync(itemId, request, GetUserId()), "Habit updated");
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("habits/{itemId}/pause")]
    [SwaggerOperation(OperationId = "Assistant_PauseHabit", Summary = "Pause a habit (exclude from daily generation)",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse<AssistantHabitDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PauseHabit(string itemId)
    {
        try
        {
            return Success(await _assistant.PauseHabitAsync(itemId, GetUserId()), "Habit paused");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("habits/{itemId}/resume")]
    [SwaggerOperation(OperationId = "Assistant_ResumeHabit", Summary = "Resume a paused habit",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse<AssistantHabitDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ResumeHabit(string itemId)
    {
        try
        {
            return Success(await _assistant.ResumeHabitAsync(itemId, GetUserId()), "Habit resumed");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("habits/{itemId}")]
    [SwaggerOperation(OperationId = "Assistant_DeleteHabit", Summary = "Delete a habit definition",
        Description = "Requires X-Anchor-Key. Coffee and Cigarettes cannot be deleted.")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteHabit(string itemId)
    {
        try
        {
            await _assistant.DeleteHabitAsync(itemId, GetUserId());
            return Success("Habit deleted");
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ex.Message);
        }
    }

    // ── Better items ──────────────────────────────────────────────────────

    [HttpPut("better-items/tomorrow")]
    [SwaggerOperation(OperationId = "Assistant_SetTomorrowBetterItems", Summary = "Set tomorrow's top 3 better items",
        Description = "Requires X-Anchor-Key. Replaces all better items dated tomorrow.")]
    [ProducesResponseType(typeof(ApiResponse<List<BetterItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SetTomorrowBetterItems([FromBody] AssistantSetTomorrowBetterItemsRequest request)
    {
        try
        {
            return Success(await _assistant.SetTomorrowTop3Async(request, GetUserId()), "Tomorrow's better items set");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("better-items")]
    [SwaggerOperation(OperationId = "Assistant_GetBetterItems", Summary = "Get better items (optional date)",
        Description = "Requires X-Anchor-Key. Query date=yyyy-MM-dd to filter.")]
    [ProducesResponseType(typeof(ApiResponse<List<BetterItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetBetterItems([FromQuery] string? date) =>
        Success(await _assistant.GetBetterItemsAsync(GetUserId(), date));

    [HttpPut("better-items")]
    [SwaggerOperation(OperationId = "Assistant_SetBetterItems", Summary = "Set top-3 better items for any date",
        Description = "Requires X-Anchor-Key. Body.date yyyy-MM-dd (default today). Replaces items for that date.")]
    [ProducesResponseType(typeof(ApiResponse<List<BetterItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SetBetterItems([FromBody] AssistantSetBetterItemsRequest request)
    {
        try
        {
            return Success(await _assistant.SetBetterItemsForDateAsync(request, GetUserId()), "Better items set");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("better-items/{id}")]
    [SwaggerOperation(OperationId = "Assistant_DeleteBetterItem", Summary = "Delete a better item",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteBetterItem(string id)
    {
        var ok = await _assistant.DeleteBetterItemAsync(id, GetUserId());
        return ok ? Success("Better item deleted") : NotFound("Better item not found");
    }

    // ── Schedule blocks (definitions) ─────────────────────────────────────

    [HttpGet("schedule/blocks")]
    [SwaggerOperation(OperationId = "Assistant_ListScheduleBlocks", Summary = "List schedule block definitions",
        Description = "Requires X-Anchor-Key. Seeds missing defaults only; never overwrites saved times.")]
    [ProducesResponseType(typeof(ApiResponse<List<ScheduleBlockDefinitionDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ListScheduleBlocks() =>
        Success(await _assistant.ListScheduleBlocksAsync(GetUserId()));

    [HttpPost("schedule/blocks")]
    [SwaggerOperation(OperationId = "Assistant_UpsertScheduleBlock", Summary = "Create or upsert schedule block by title",
        Description = "Requires X-Anchor-Key. Upserts by Title. Supports weekly daysOfWeek and midnight-crossing end times.")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockDefinitionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpsertScheduleBlock([FromBody] AssistantScheduleBlockUpsertRequest request)
    {
        try
        {
            return Success(await _assistant.UpsertScheduleBlockAsync(request, GetUserId()), "Schedule block upserted");
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("schedule/blocks/{id}")]
    [SwaggerOperation(OperationId = "Assistant_UpdateScheduleBlock", Summary = "Update schedule block by id",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockDefinitionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateScheduleBlock(string id, [FromBody] AssistantScheduleBlockUpsertRequest request)
    {
        try
        {
            return Success(await _assistant.UpdateScheduleBlockAsync(id, request, GetUserId()), "Schedule block updated");
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("schedule/blocks/{id}")]
    [SwaggerOperation(OperationId = "Assistant_DeleteScheduleBlock", Summary = "Delete schedule block definition",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteScheduleBlock(string id)
    {
        var ok = await _assistant.DeleteScheduleBlockAsync(id, GetUserId());
        return ok ? Success("Schedule block deleted") : NotFound("Schedule block not found");
    }

    [HttpGet("schedule/day")]
    [SwaggerOperation(OperationId = "Assistant_GetDayBlocks", Summary = "Get per-day schedule instances",
        Description = "Requires X-Anchor-Key. Query date=yyyy-MM-dd. Materializes from definitions if missing.")]
    [ProducesResponseType(typeof(ApiResponse<List<ScheduleBlockInstanceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDayBlocks([FromQuery] string date)
    {
        try
        {
            return Success(await _assistant.GetDayBlocksAsync(GetUserId(), date));
        }
        catch (FormatException)
        {
            return BadRequest("date must be yyyy-MM-dd");
        }
    }

    [HttpPost("schedule/day")]
    [SwaggerOperation(OperationId = "Assistant_CreateDayOverride", Summary = "Create a per-day schedule override",
        Description = "Requires X-Anchor-Key. Adds an instance for one date (does not change the definition).")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockInstanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateDayOverride([FromBody] AssistantDayBlockOverrideRequest request)
    {
        try
        {
            return Success(await _assistant.CreateDayOverrideAsync(request, GetUserId()), "Day override created");
        }
        catch (Exception ex) when (ex is ArgumentException or FormatException)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("schedule/day/{instanceId}")]
    [SwaggerOperation(OperationId = "Assistant_UpdateDayBlock", Summary = "Update a per-day schedule instance",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleBlockInstanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateDayBlock(string instanceId, [FromBody] AssistantUpdateDayBlockRequest request)
    {
        try
        {
            return Success(await _assistant.UpdateDayBlockAsync(instanceId, request, GetUserId()), "Day block updated");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // ── Routines / steps / mode settings ──────────────────────────────────

    [HttpGet("routines")]
    [SwaggerOperation(OperationId = "Assistant_ListRoutines", Summary = "List morning/night routines",
        Description = "Requires X-Anchor-Key. Seeds from catalog only if missing.")]
    [ProducesResponseType(typeof(ApiResponse<List<UnifiedRoutineDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ListRoutines() =>
        Success(await _assistant.ListRoutinesAsync(GetUserId()));

    [HttpGet("routines/{key}")]
    [SwaggerOperation(OperationId = "Assistant_GetRoutine", Summary = "Get routine by key (morning|night)",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse<UnifiedRoutineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRoutine(string key)
    {
        try
        {
            return Success(await _assistant.GetRoutineAsync(GetUserId(), key));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("routines/{key}")]
    [SwaggerOperation(OperationId = "Assistant_UpsertRoutine", Summary = "Update routine window, triggers, and/or steps",
        Description = "Requires X-Anchor-Key. Partial update. Steps/shorterSteps replace when provided.")]
    [ProducesResponseType(typeof(ApiResponse<UnifiedRoutineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpsertRoutine(string key, [FromBody] AssistantRoutineUpsertRequest request)
    {
        try
        {
            return Success(await _assistant.UpsertRoutineAsync(GetUserId(), key, request), "Routine updated");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("routines/{key}/steps")]
    [SwaggerOperation(OperationId = "Assistant_ReplaceRoutineSteps", Summary = "Replace all routine steps",
        Description = "Requires X-Anchor-Key. Set shorter=true for hard-day variant.")]
    [ProducesResponseType(typeof(ApiResponse<UnifiedRoutineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReplaceSteps(string key, [FromBody] AssistantReplaceStepsRequest request)
    {
        try
        {
            return Success(await _assistant.ReplaceStepsAsync(GetUserId(), key, request), "Steps replaced");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("routines/{key}/steps")]
    [SwaggerOperation(OperationId = "Assistant_UpsertRoutineStep", Summary = "Create or update one routine step",
        Description = "Requires X-Anchor-Key. Query shorter=true for hard-day variant.")]
    [ProducesResponseType(typeof(ApiResponse<UnifiedRoutineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpsertStep(string key, [FromBody] RoutineStepDto step, [FromQuery] bool shorter = false)
    {
        try
        {
            return Success(await _assistant.UpsertStepAsync(GetUserId(), key, step, shorter), "Step upserted");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("routines/{key}/steps/{stepId}")]
    [SwaggerOperation(OperationId = "Assistant_DeleteRoutineStep", Summary = "Delete a routine step",
        Description = "Requires X-Anchor-Key. Query shorter=true for hard-day variant.")]
    [ProducesResponseType(typeof(ApiResponse<UnifiedRoutineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteStep(string key, string stepId, [FromQuery] bool shorter = false)
    {
        try
        {
            return Success(await _assistant.DeleteStepAsync(GetUserId(), key, stepId, shorter), "Step deleted");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("routines/{key}/steps/reorder")]
    [SwaggerOperation(OperationId = "Assistant_ReorderRoutineSteps", Summary = "Reorder routine steps",
        Description = "Requires X-Anchor-Key. Body.stepIds is the new order.")]
    [ProducesResponseType(typeof(ApiResponse<UnifiedRoutineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReorderSteps(string key, [FromBody] AssistantReorderStepsRequest request)
    {
        try
        {
            return Success(await _assistant.ReorderStepsAsync(GetUserId(), key, request), "Steps reordered");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("modes/{key}")]
    [SwaggerOperation(OperationId = "Assistant_UpdateModeSettings", Summary = "Update morning/night mode trigger and window",
        Description = "Requires X-Anchor-Key. key=morning|night. Sets triggerHour/triggerMinute and optional start/end.")]
    [ProducesResponseType(typeof(ApiResponse<UnifiedRoutineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateModeSettings(string key, [FromBody] AssistantModeSettingsRequest request)
    {
        try
        {
            return Success(await _assistant.UpdateModeSettingsAsync(GetUserId(), key, request), "Mode settings updated");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // ── Sessions ──────────────────────────────────────────────────────────

    [HttpGet("sessions/active")]
    [SwaggerOperation(OperationId = "Assistant_GetActiveSession", Summary = "Get the active work session",
        Description = "Requires X-Anchor-Key.")]
    [ProducesResponseType(typeof(ApiResponse<WorkSessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetActiveSession()
    {
        var session = await _assistant.GetActiveSessionAsync(GetUserId());
        return session == null ? Success<WorkSessionDto?>(null, "No active session") : Success(session);
    }

    [HttpPost("sessions/{id}/close")]
    [SwaggerOperation(OperationId = "Assistant_CloseSession", Summary = "Close / finish an open work session",
        Description = "Requires X-Anchor-Key. Outcome defaults to left.")]
    [ProducesResponseType(typeof(ApiResponse<WorkSessionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CloseSession(string id, [FromBody] AssistantCloseSessionRequest? request)
    {
        try
        {
            return Success(
                await _assistant.CloseSessionAsync(GetUserId(), id, request ?? new AssistantCloseSessionRequest()),
                "Session closed");
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException or POS.Core.Exceptions.NotFoundException)
        {
            return BadRequest(ex.Message);
        }
    }
}
