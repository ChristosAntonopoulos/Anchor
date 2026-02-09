using Microsoft.AspNetCore.Mvc;
using POS.Infrastructure.Data.Seeders;

namespace POS.Api.Controllers;

/// <summary>
/// Database seeding endpoint (Development only)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly DataSeeder _dataSeeder;
    private readonly IWebHostEnvironment _environment;

    public SeedController(DataSeeder dataSeeder, IWebHostEnvironment environment)
    {
        _dataSeeder = dataSeeder;
        _environment = environment;
    }

    /// <summary>
    /// Seed the database with initial data (Development only)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> SeedDatabase()
    {
        // Only allow in Development environment
        if (!_environment.IsDevelopment())
        {
            return NotFound("This endpoint is only available in Development environment");
        }

        try
        {
            var isSeeded = await _dataSeeder.IsSeededAsync();
            if (isSeeded)
            {
                return Ok(new
                {
                    message = "Database already seeded. Use DELETE to reset and reseed.",
                    seeded = true
                });
            }

            await _dataSeeder.SeedAsync();

            return Ok(new
            {
                message = "Database seeded successfully",
                seeded = true
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Error seeding database",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Check if database is seeded (Development only)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> IsSeeded()
    {
        // Only allow in Development environment
        if (!_environment.IsDevelopment())
        {
            return NotFound("This endpoint is only available in Development environment");
        }

        var isSeeded = await _dataSeeder.IsSeededAsync();
        return Ok(new
        {
            seeded = isSeeded
        });
    }

    /// <summary>
    /// Reset and reseed database (Development only)
    /// WARNING: This will delete ALL data from ALL collections
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> ResetAndSeed()
    {
        // Only allow in Development environment
        if (!_environment.IsDevelopment())
        {
            return NotFound("This endpoint is only available in Development environment");
        }

        try
        {
            // Delete all collections first to remove old structure data
            await _dataSeeder.DeleteAllCollectionsAsync();
            // Then seed with new structure
            await _dataSeeder.SeedAsync();

            return Ok(new
            {
                message = "Database reset and reseeded successfully",
                seeded = true
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Error resetting and seeding database",
                error = ex.Message
            });
        }
    }
}
