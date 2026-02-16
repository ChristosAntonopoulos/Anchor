using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.BetterToday;
using POS.Application.Services.BetterToday;
using POS.Core.Exceptions;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Better items endpoints
/// </summary>
[ApiController]
[Route("api/better-items")]
[Tags("Better Items")]
public class BetterItemsController : BaseController
{
    private readonly BetterItemService _betterItemService;

    public BetterItemsController(BetterItemService betterItemService)
    {
        _betterItemService = betterItemService;
    }

    /// <summary>
    /// Complete a better item
    /// </summary>
    [HttpPost("complete")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompleteItem([FromBody] CompleteBetterItemRequest request)
    {
        var userId = GetUserId();
        await _betterItemService.CompleteItemAsync(request, userId);
        return Success("Better item completed successfully");
    }

    /// <summary>
    /// Accept a better item
    /// </summary>
    [HttpPost("accept")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AcceptItem([FromBody] AcceptBetterItemRequest request)
    {
        var userId = GetUserId();
        await _betterItemService.AcceptItemAsync(request, userId);
        return Success("Better item accepted successfully");
    }

    /// <summary>
    /// Edit a better item
    /// </summary>
    [HttpPost("edit")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> EditItem([FromBody] EditBetterItemRequest request)
    {
        var userId = GetUserId();
        await _betterItemService.EditItemAsync(request, userId);
        return Success("Better item edited successfully");
    }

    /// <summary>
    /// Reject a better item
    /// </summary>
    [HttpPost("reject")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectItem([FromBody] RejectBetterItemRequest request)
    {
        var userId = GetUserId();
        await _betterItemService.RejectItemAsync(request, userId);
        return Success("Better item rejected successfully");
    }

    /// <summary>
    /// Create a better item
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BetterItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateBetterItem([FromBody] CreateBetterItemDto request)
    {
        var userId = GetUserId();
        var item = await _betterItemService.CreateBetterItemAsync(request, userId);
        return Success(item, "Better item created successfully");
    }

    /// <summary>
    /// Get all better items (optionally filtered by date range)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<BetterItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllBetterItems([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var userId = GetUserId();
        var items = await _betterItemService.GetAllBetterItemsAsync(userId, startDate, endDate);
        return Success(items);
    }

    /// <summary>
    /// Get better item by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<BetterItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetBetterItemById(string id)
    {
        var userId = GetUserId();
        var item = await _betterItemService.GetBetterItemByIdAsync(id, userId);
        if (item == null)
        {
            return NotFound("Better item not found");
        }
        return Success(item);
    }

    /// <summary>
    /// Delete a better item
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteBetterItem(string id)
    {
        var userId = GetUserId();
        var deleted = await _betterItemService.DeleteBetterItemAsync(id, userId);
        if (!deleted)
        {
            return NotFound("Better item not found");
        }
        return Success("Better item deleted successfully");
    }
}
