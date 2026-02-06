using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.BetterToday;
using POS.Application.Services.BetterToday;
using POS.Core.Exceptions;

namespace POS.Api.Controllers;

/// <summary>
/// Better items endpoints
/// </summary>
[ApiController]
[Route("api/better-items")]
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
    public async Task<IActionResult> RejectItem([FromBody] RejectBetterItemRequest request)
    {
        var userId = GetUserId();
        await _betterItemService.RejectItemAsync(request, userId);
        return Success("Better item rejected successfully");
    }
}
