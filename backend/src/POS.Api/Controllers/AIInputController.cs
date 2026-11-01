using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.AIInput;
using POS.Application.Services.AIInput;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// AI Input endpoints for natural language processing
/// </summary>
[ApiController]
[Route("api/ai-input")]
[Tags("Utilities")]
public class AIInputController : BaseController
{
    private readonly AIInputService _aiInputService;

    public AIInputController(AIInputService aiInputService)
    {
        _aiInputService = aiInputService;
    }

    /// <summary>
    /// Submit natural language input for AI processing to create tasks, schedule blocks, or other entities
    /// </summary>
    /// <param name="request">AI input request. Text is required.</param>
    /// <returns>AI processing result with created entities</returns>
    /// <remarks>
    /// Processes natural language input and automatically creates tasks, schedule blocks, or other relevant entities.
    /// Example request:
    /// <code>
    /// {
    ///   "text": "Meeting with John tomorrow at 2pm about the project"
    /// }
    /// </code>
    /// The AI will parse this and create appropriate schedule blocks or tasks.
    /// </remarks>
    /// <response code="200">Input processed successfully</response>
    /// <response code="400">Validation error - text is required</response>
    [HttpPost]
    [SwaggerOperation(OperationId = "AIInput_SubmitInput", Summary = "Submit natural language input for AI processing")]
    [ProducesResponseType(typeof(ApiResponse<AIInputDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SubmitInput([FromBody] SubmitAIInputRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return ValidationError(new List<ErrorDetail>
            {
                new ErrorDetail { Field = "text", Message = "Text is required" }
            });
        }

        var userId = GetUserId();
        var input = await _aiInputService.SubmitInputAsync(request.Text, userId);
        return Success(input, "Input submitted for AI processing");
    }

    /// <summary>
    /// Get pending AI inputs that are waiting to be processed (for debugging/monitoring)
    /// </summary>
    [HttpGet("pending")]
    [SwaggerOperation(OperationId = "AIInput_GetPendingInputs", Summary = "Get pending AI inputs")]
    [ProducesResponseType(typeof(ApiResponse<List<AIInputDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPendingInputs()
    {
        var userId = GetUserId();
        var inputs = await _aiInputService.GetPendingInputsAsync(userId);
        return Success(inputs);
    }

    /// <summary>
    /// Get AI input status by id (for polling after submit).
    /// </summary>
    [HttpGet("{id}")]
    [SwaggerOperation(OperationId = "AIInput_GetInput", Summary = "Get AI input status")]
    [ProducesResponseType(typeof(ApiResponse<AIInputDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInput(string id)
    {
        var userId = GetUserId();
        var input = await _aiInputService.GetInputAsync(id, userId);
        if (input == null)
            return NotFound("AI input not found");

        return Success(input);
    }
}
