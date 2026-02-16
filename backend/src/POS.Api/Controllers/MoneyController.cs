using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
    [ProducesResponseType(typeof(ApiResponse<MoneySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMoneySummary()
    {
        var userId = GetUserId();
        var summary = await _moneyService.GetMoneySummaryAsync(userId);
        return Success(summary);
    }

    /// <summary>
    /// Create an income entry
    /// </summary>
    [HttpPost("income")]
    [ProducesResponseType(typeof(ApiResponse<IncomeEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
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
    [ProducesResponseType(typeof(ApiResponse<List<IncomeEntryDto>>), StatusCodes.Status200OK)]
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
