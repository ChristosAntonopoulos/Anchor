using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.BetterToday;
using POS.Core.Entities.BetterToday;
using POS.Core.Exceptions;
using POS.Core.Repositories;

namespace POS.Application.Services.BetterToday;

/// <summary>
/// Manages user interactions with AI-proposed better items.
/// </summary>
public class BetterItemService
{
    private readonly IRepository<BetterItem> _betterItemRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<BetterItemService> _logger;

    public BetterItemService(
        IRepository<BetterItem> betterItemRepository,
        IMapper mapper,
        ILogger<BetterItemService> logger)
    {
        _betterItemRepository = betterItemRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task CompleteItemAsync(CompleteBetterItemRequest request, string userId)
    {
        _logger.LogInformation("Completing better item {ItemId} for user {UserId}", request.Id, userId);

        var item = await _betterItemRepository.GetByIdAsync(request.Id, userId)
                   ?? throw new NotFoundException("BetterItem", request.Id);

        item.Completed = true;
        await _betterItemRepository.UpdateAsync(item);
    }

    public async Task AcceptItemAsync(AcceptBetterItemRequest request, string userId)
    {
        _logger.LogInformation("Accepting better item {ItemId} for user {UserId}", request.Id, userId);

        var item = await _betterItemRepository.GetByIdAsync(request.Id, userId)
                   ?? throw new NotFoundException("BetterItem", request.Id);

        item.Completed = false;
        await _betterItemRepository.UpdateAsync(item);
    }

    public async Task EditItemAsync(EditBetterItemRequest request, string userId)
    {
        _logger.LogInformation("Editing better item {ItemId} for user {UserId}", request.Id, userId);

        var item = await _betterItemRepository.GetByIdAsync(request.Id, userId)
                   ?? throw new NotFoundException("BetterItem", request.Id);

        item.Title = request.Title;
        await _betterItemRepository.UpdateAsync(item);
    }

    public async Task RejectItemAsync(RejectBetterItemRequest request, string userId)
    {
        _logger.LogInformation("Rejecting better item {ItemId} for user {UserId}", request.Id, userId);

        var exists = await _betterItemRepository.ExistsAsync(request.Id, userId);
        if (!exists)
            throw new NotFoundException("BetterItem", request.Id);

        await _betterItemRepository.DeleteAsync(request.Id, userId);
    }
}
