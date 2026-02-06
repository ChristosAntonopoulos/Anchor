using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Money;
using POS.Application.Services.Money;

namespace POS.Api.Controllers;

/// <summary>
/// Money endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
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
    public async Task<IActionResult> GetAllIncome()
    {
        var userId = GetUserId();
        var income = await _moneyService.GetAllIncomeAsync(userId);
        return Success(income);
    }
}
