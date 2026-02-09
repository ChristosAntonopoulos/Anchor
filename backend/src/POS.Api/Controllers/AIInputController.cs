using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.AIInput;
using POS.Application.Services.AIInput;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// AI Input endpoints for natural language processing
/// </summary>
[ApiController]
[Route("api/ai-input")]
public class AIInputController : BaseController
{
    private readonly AIInputService _aiInputService;

    public AIInputController(AIInputService aiInputService)
    {
        _aiInputService = aiInputService;
    }

    /// <summary>
    /// Submit natural language input for AI processing
    /// </summary>
    [HttpPost]
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
    /// Get pending inputs (for debugging/monitoring)
    /// </summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingInputs()
    {
        var userId = GetUserId();
        var inputs = await _aiInputService.GetPendingInputsAsync(userId);
        return Success(inputs);
    }
}
