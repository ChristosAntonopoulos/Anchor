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

    /// <summary>
    /// Create a better item
    /// </summary>
    public async Task<BetterItemDto> CreateBetterItemAsync(CreateBetterItemDto dto, string userId)
    {
        _logger.LogInformation("Creating better item for user {UserId}", userId);
        
        var entity = _mapper.Map<BetterItem>(dto);
        entity.UserId = userId;
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        
        await _context.BetterItems.InsertOneAsync(entity);
        
        return _mapper.Map<BetterItemDto>(entity);
    }

    /// <summary>
    /// Get better item by ID
    /// </summary>
    public async Task<BetterItemDto?> GetBetterItemByIdAsync(string id, string userId)
    {
        _logger.LogInformation("Getting better item {ItemId} for user {UserId}", id, userId);
        
        var filter = Builders<BetterItem>.Filter.And(
            Builders<BetterItem>.Filter.Eq(bi => bi.Id, id),
            Builders<BetterItem>.Filter.Eq(bi => bi.UserId, userId)
        );
        
        var item = await _context.BetterItems.Find(filter).FirstOrDefaultAsync();
        return item != null ? _mapper.Map<BetterItemDto>(item) : null;
    }

    /// <summary>
    /// Get all better items (optionally filtered by date range)
    /// </summary>
    public async Task<List<BetterItemDto>> GetAllBetterItemsAsync(string userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        _logger.LogInformation("Getting better items for user {UserId}", userId);
        
        var filter = Builders<BetterItem>.Filter.Eq(bi => bi.UserId, userId);
        
        if (startDate.HasValue)
        {
            filter = Builders<BetterItem>.Filter.And(
                filter,
                Builders<BetterItem>.Filter.Gte(bi => bi.Date, startDate.Value.Date)
            );
        }
        
        if (endDate.HasValue)
        {
            filter = Builders<BetterItem>.Filter.And(
                filter,
                Builders<BetterItem>.Filter.Lte(bi => bi.Date, endDate.Value.Date)
            );
        }
        
        var sort = Builders<BetterItem>.Sort.Descending(bi => bi.Date).Descending(bi => bi.CreatedAt);
        
        var items = await _context.BetterItems
            .Find(filter)
            .Sort(sort)
            .ToListAsync();
        
        return _mapper.Map<List<BetterItemDto>>(items);
    }

    /// <summary>
    /// Delete a better item
    /// </summary>
    public async Task<bool> DeleteBetterItemAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting better item {ItemId} for user {UserId}", id, userId);
        
        var filter = Builders<BetterItem>.Filter.And(
            Builders<BetterItem>.Filter.Eq(bi => bi.Id, id),
            Builders<BetterItem>.Filter.Eq(bi => bi.UserId, userId)
        );
        
        var result = await _context.BetterItems.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }
}
