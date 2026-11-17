using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Assistant;
using POS.Application.DTOs.BetterToday;
using POS.Application.DTOs.Discipline;
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

    /// <summary>
    /// Create a task or inbox item.
    /// </summary>
    [HttpPost("tasks")]
    [SwaggerOperation(
        OperationId = "Assistant_CreateTask",
        Summary = "Create task / inbox item",
        Description = "Requires X-Anchor-Key. Default status is inbox; set status=today for the focus list.")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateTask([FromBody] AssistantCreateTaskRequest request)
    {
        try
        {
            var task = await _assistant.CreateTaskAsync(request, GetUserId());
            return Success(task, "Task created");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Check off a discipline habit for today.
    /// </summary>
    [HttpPost("discipline/check")]
    [SwaggerOperation(
        OperationId = "Assistant_CheckDiscipline",
        Summary = "Check off a discipline habit for today",
        Description = "Requires X-Anchor-Key. Match by itemId (Workout1, Read10Pages, …) or itemName. Toggles set checked (default true); counters increment by 1.")]
    [ProducesResponseType(typeof(ApiResponse<DisciplineEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckDiscipline([FromBody] AssistantCheckDisciplineRequest request)
    {
        try
        {
            var entry = await _assistant.CheckDisciplineAsync(request, GetUserId());
            return Success(entry, "Discipline updated");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Set tomorrow's top 3 What Makes Me Better Today items (replaces existing for that date).
    /// </summary>
    [HttpPut("better-items/tomorrow")]
    [SwaggerOperation(
        OperationId = "Assistant_SetTomorrowBetterItems",
        Summary = "Set tomorrow's top 3 better items",
        Description = "Requires X-Anchor-Key. Replaces all better items dated tomorrow with the 1–3 titles provided.")]
    [ProducesResponseType(typeof(ApiResponse<List<BetterItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SetTomorrowBetterItems([FromBody] AssistantSetTomorrowBetterItemsRequest request)
    {
        try
        {
            var items = await _assistant.SetTomorrowTop3Async(request, GetUserId());
            return Success(items, "Tomorrow's better items set");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
