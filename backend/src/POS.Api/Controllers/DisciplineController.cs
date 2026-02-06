using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Discipline;
using POS.Application.Services.Discipline;

namespace POS.Api.Controllers;

/// <summary>
/// Discipline endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DisciplineController : BaseController
{
    private readonly DisciplineService _disciplineService;

    public DisciplineController(DisciplineService disciplineService)
    {
        _disciplineService = disciplineService;
    }

    /// <summary>
    /// Get today's discipline entry
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDiscipline()
    {
        var userId = GetUserId();
        var discipline = await _disciplineService.GetTodayDisciplineAsync(userId);
        return Success(discipline);
    }

    /// <summary>
    /// Update today's discipline entry
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateDiscipline([FromBody] UpdateDisciplineRequest request)
    {
        var userId = GetUserId();
        var discipline = await _disciplineService.UpdateDisciplineAsync(request, userId);
        return Success(discipline);
    }
}
