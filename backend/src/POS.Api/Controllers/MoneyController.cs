using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using POS.Application.DTOs.Money;
using POS.Application.Services.Money;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Money endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Money")]
public class MoneyController : BaseController
{
    private readonly MoneyService _moneyService;

    public MoneyController(MoneyService moneyService)
    {
        _moneyService = moneyService;
    }

    /// <summary>
    /// Get money summary for current month
    /// </summary>
    [HttpGet("summary")]
    [SwaggerOperation(OperationId = "Money_GetSummary", Summary = "Get money summary for current month")]
    [ProducesResponseType(typeof(ApiResponse<MoneySummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetMoneySummary()
    {
        var userId = GetUserId();
        var summary = await _moneyService.GetMoneySummaryAsync(userId);
        return Success(summary);
    }

    /// <summary>
    /// Create a new income entry
    /// </summary>
    /// <param name="request">Income entry request. Date, Source, and Amount are required.</param>
    /// <returns>Created income entry with generated ID</returns>
    /// <remarks>
    /// Example request:
    /// <code>
    /// {
    ///   "date": "2024-02-26",
    ///   "source": "Freelance Project",
    ///   "amount": 1500.00,
    ///   "currency": "EUR"
    /// }
    /// </code>
    /// Date format: YYYY-MM-DD
    /// Currency defaults to EUR if not provided.
    /// </remarks>
    /// <response code="200">Income entry created successfully</response>
    /// <response code="400">Validation error - missing required fields or invalid data</response>
    [HttpPost("income")]
    [SwaggerOperation(OperationId = "Money_CreateIncome", Summary = "Create a new income entry")]
    [ProducesResponseType(typeof(ApiResponse<IncomeEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateIncome([FromBody] CreateIncomeRequest request)
    {
        var userId = GetUserId();
        var income = await _moneyService.CreateIncomeAsync(request, userId);
        return Success(income);
    }

    /// <summary>
    /// Get all income entries
    /// </summary>
    [HttpGet("income")]
    [SwaggerOperation(OperationId = "Money_GetAllIncome", Summary = "Get all income entries")]
    [ProducesResponseType(typeof(ApiResponse<List<IncomeEntryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllIncome()
    {
        var userId = GetUserId();
        var income = await _moneyService.GetAllIncomeAsync(userId);
        return Success(income);
    }

    /// <summary>
    /// Get income entry by ID
    /// </summary>
    [HttpGet("income/{id}")]
    [ProducesResponseType(typeof(ApiResponse<IncomeEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetIncomeById(string id)
    {
        var userId = GetUserId();
        var income = await _moneyService.GetIncomeByIdAsync(id, userId);
        if (income == null)
        {
            return NotFound("Income entry not found");
        }
        return Success(income);
    }

    /// <summary>
    /// Update income entry
    /// </summary>
    [HttpPut("income/{id}")]
    [ProducesResponseType(typeof(ApiResponse<IncomeEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateIncome(string id, [FromBody] UpdateIncomeRequest request)
    {
        var userId = GetUserId();
        var income = await _moneyService.UpdateIncomeAsync(id, request, userId);
        if (income == null)
        {
            return NotFound("Income entry not found");
        }
        return Success(income);
    }

    /// <summary>
    /// Delete income entry
    /// </summary>
    [HttpDelete("income/{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteIncome(string id)
    {
        var userId = GetUserId();
        var deleted = await _moneyService.DeleteIncomeAsync(id, userId);
        if (!deleted)
        {
            return NotFound("Income entry not found");
        }
        return Success("Income entry deleted successfully");
    }
}
