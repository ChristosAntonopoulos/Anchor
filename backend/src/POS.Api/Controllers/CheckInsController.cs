using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.CBT;
using POS.Application.Services.CBT;
using POS.Shared.Results;

namespace POS.Api.Controllers;

[ApiController]
[Route("api/check-ins")]
[Tags("Check-in")]
public class CheckInsController : BaseController
{
    private readonly CheckInService _checkIns;
    private readonly ActivityCatalogService _catalog;

    public CheckInsController(CheckInService checkIns, ActivityCatalogService catalog)
    {
        _checkIns = checkIns;
        _catalog = catalog;
    }

    [HttpPost]
    [SwaggerOperation(OperationId = "CheckIns_Create", Summary = "Save a check-in draft or finished entry")]
    [ProducesResponseType(typeof(ApiResponse<CBTEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCBTEntryRequest request)
    {
        try
        {
            var entry = await _checkIns.CreateAsync(request, GetUserId());
            return Success(entry, "Saved");
        }
        catch (ArgumentException ex)
        {
            return ValidationError(new List<ErrorDetail>
            {
                new() { Field = "checkIn", Message = ex.Message }
            });
        }
    }

    [HttpGet]
    [SwaggerOperation(OperationId = "CheckIns_List", Summary = "List check-ins and legacy CBT entries")]
    [ProducesResponseType(typeof(ApiResponse<List<CBTEntryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? state = null,
        [FromQuery] string? type = null)
    {
        var entries = await _checkIns.ListAsync(GetUserId(), from, to, state, type);
        return Success(entries);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CBTEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(string id)
    {
        var entry = await _checkIns.GetAsync(id, GetUserId());
        return entry == null ? NotFound("Check-in not found") : Success(entry);
    }

    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CBTEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateCBTEntryRequest request)
    {
        var entry = await _checkIns.UpdateAsync(id, request, GetUserId());
        return entry == null ? NotFound("Check-in not found") : Success(entry, "Saved");
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _checkIns.DeleteAsync(id, GetUserId());
        return deleted ? Success("Deleted") : NotFound("Check-in not found");
    }

    [HttpPost("{id}/assistance")]
    [SwaggerOperation(OperationId = "CheckIns_Assist", Summary = "Suggest reviewed next steps without changing records")]
    [ProducesResponseType(typeof(ApiResponse<CheckInAssistResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assist(string id, [FromBody] CheckInAssistRequest? request)
    {
        var response = await _checkIns.AssistAsync(id, request ?? new CheckInAssistRequest(), GetUserId());
        if (response == null)
        {
            return NotFound("Check-in not found");
        }

        return Success(CheckInService.ValidateAssistResponse(response, _catalog));
    }

    [HttpPut("{id}/thought-record")]
    [ProducesResponseType(typeof(ApiResponse<CBTEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SaveThoughtRecord(string id, [FromBody] UpdateCBTEntryRequest request)
    {
        var entry = await _checkIns.SaveThoughtRecordAsync(id, request, GetUserId());
        return entry == null ? NotFound("Check-in not found") : Success(entry, "Saved");
    }

    [HttpPut("{id}/problem-solving")]
    [ProducesResponseType(typeof(ApiResponse<CBTEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SaveProblemSolving(string id, [FromBody] ProblemSolvingRecordDto request)
    {
        var entry = await _checkIns.SaveProblemSolvingAsync(id, request, GetUserId());
        return entry == null ? NotFound("Check-in not found") : Success(entry, "Saved");
    }

    [HttpGet("~/api/activity-templates")]
    [ProducesResponseType(typeof(ApiResponse<List<ActivityTemplateDto>>), StatusCodes.Status200OK)]
    public IActionResult GetTemplates()
    {
        return Success(_checkIns.GetTemplates().ToList());
    }

    [HttpGet("~/api/activity-plans")]
    [ProducesResponseType(typeof(ApiResponse<List<BehavioralActivityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListPlans([FromQuery] string? checkInId = null)
    {
        var plans = await _checkIns.ListPlansAsync(GetUserId(), checkInId);
        return Success(plans);
    }

    [HttpPost("~/api/activity-plans")]
    [ProducesResponseType(typeof(ApiResponse<BehavioralActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePlan([FromBody] CreateBehavioralActivityRequest request)
    {
        try
        {
            var plan = await _checkIns.CreatePlanAsync(request, GetUserId());
            return Success(plan, "Saved");
        }
        catch (ArgumentException ex)
        {
            return ValidationError(new List<ErrorDetail>
            {
                new() { Field = "activityPlan", Message = ex.Message }
            });
        }
    }

    [HttpPatch("~/api/activity-plans/{id}")]
    [ProducesResponseType(typeof(ApiResponse<BehavioralActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePlan(string id, [FromBody] UpdateBehavioralActivityRequest request)
    {
        var plan = await _checkIns.UpdatePlanAsync(id, request, GetUserId());
        return plan == null ? NotFound("Activity not found") : Success(plan, "Saved");
    }

    [HttpPost("~/api/activity-plans/{id}/attempts")]
    [ProducesResponseType(typeof(ApiResponse<BehavioralActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordAttempt(string id, [FromBody] CreateActivityAttemptRequest request)
    {
        var plan = await _checkIns.RecordAttemptAsync(id, request, GetUserId());
        return plan == null ? NotFound("Activity not found") : Success(plan, "Saved");
    }

    [HttpPost("~/api/activity-plans/{id}/task")]
    [ProducesResponseType(typeof(ApiResponse<LinkActivityTaskResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LinkTask(string id)
    {
        var result = await _checkIns.LinkTaskAsync(id, GetUserId());
        return result == null ? NotFound("Activity not found") : Success(result, result.AlreadyLinked ? "Already linked" : "Added to tasks");
    }
}
