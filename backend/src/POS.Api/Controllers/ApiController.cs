using Microsoft.AspNetCore.Mvc;

namespace POS.Api.Controllers;

/// <summary>
/// Root API endpoint - provides API information
/// </summary>
[ApiController]
[Route("api")]
public class ApiController : ControllerBase
{
    /// <summary>
    /// Get API information
    /// </summary>
    [HttpGet]
    public IActionResult GetApiInfo()
    {
        return Ok(new
        {
            name = "Personal Operating System API",
            version = "1.0.0",
            status = "running",
            endpoints = new
            {
                health = "/api/health",
                today = "/api/today",
                tasks = "/api/tasks",
                schedule = "/api/schedule",
                discipline = "/api/discipline",
                diet = "/api/diet",
                money = "/api/money",
                deadlines = "/api/deadlines",
                weeklyReview = "/api/weekly-review"
            }
        });
    }
}
