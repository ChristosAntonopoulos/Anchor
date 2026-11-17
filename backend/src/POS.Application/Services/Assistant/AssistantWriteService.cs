using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Assistant;
using POS.Application.DTOs.BetterToday;
using POS.Application.DTOs.Discipline;
using POS.Application.DTOs.Tasks;
using POS.Application.Services.BetterToday;
using POS.Application.Services.Discipline;
using POS.Application.Services.Tasks;
using POS.Core.Entities.BetterToday;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Assistant;

public class AssistantWriteService
{
    private readonly TaskService _taskService;
    private readonly DisciplineService _disciplineService;
    private readonly BetterItemService _betterItemService;
    private readonly MongoDbContext _context;
    private readonly ILogger<AssistantWriteService> _logger;

    public AssistantWriteService(
        TaskService taskService,
        DisciplineService disciplineService,
        BetterItemService betterItemService,
        MongoDbContext context,
        ILogger<AssistantWriteService> logger)
    {
        _taskService = taskService;
        _disciplineService = disciplineService;
        _betterItemService = betterItemService;
        _context = context;
        _logger = logger;
    }

    public async Task<TaskDto> CreateTaskAsync(AssistantCreateTaskRequest request, string userId)
    {
        var create = new CreateTaskRequest
        {
            Title = request.Title.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "work" : request.Category.Trim(),
            Notes = request.Notes,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "inbox" : request.Status.Trim(),
            Priority = request.Priority
        };
        return await _taskService.CreateTaskAsync(create, userId);
    }

    public async Task<DisciplineEntryDto> CheckDisciplineAsync(AssistantCheckDisciplineRequest request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.ItemId) && string.IsNullOrWhiteSpace(request.ItemName))
        {
            throw new ArgumentException("Provide itemId or itemName.");
        }

        var today = DateTime.UtcNow.Date;
        var entry = await _disciplineService.GetTodayDisciplineAsync(userId);
        var match = FindItem(entry, request.BlockId, request.ItemId, request.ItemName);
        if (match == null)
        {
            throw new ArgumentException("Discipline item not found. Use itemId (e.g. Workout1) or itemName.");
        }

        var (blockId, item) = match.Value;
        _logger.LogInformation(
            "Assistant checking discipline {BlockId}/{ItemId} type {Type} for {UserId}",
            blockId,
            item.ItemId,
            item.Type,
            userId);

        if (string.Equals(item.Type, "toggle", StringComparison.OrdinalIgnoreCase))
        {
            var value = request.Checked ?? true;
            return await _disciplineService.UpdateToggleAsync(userId, today, blockId, item.ItemId, value);
        }

        return await _disciplineService.IncrementCounterAsync(userId, today, blockId, item.ItemId);
    }

    public async Task<List<BetterItemDto>> SetTomorrowTop3Async(AssistantSetTomorrowBetterItemsRequest request, string userId)
    {
        if (request.Items.Count is < 1 or > 3)
        {
            throw new ArgumentException("Provide 1 to 3 items for tomorrow.");
        }

        var tomorrow = DateTime.UtcNow.Date.AddDays(1);
        var filter = Builders<BetterItem>.Filter.And(
            Builders<BetterItem>.Filter.Eq(b => b.UserId, userId),
            Builders<BetterItem>.Filter.Eq(b => b.Date, tomorrow));

        await _context.BetterItems.DeleteManyAsync(filter);

        var created = new List<BetterItemDto>();
        foreach (var item in request.Items)
        {
            var dto = new CreateBetterItemDto
            {
                Title = item.Title.Trim(),
                Category = string.IsNullOrWhiteSpace(item.Category) ? "work" : item.Category.Trim(),
                Date = tomorrow,
                Source = "assistant"
            };
            created.Add(await _betterItemService.CreateBetterItemAsync(dto, userId));
        }

        return created;
    }

    private static (string BlockId, DisciplineItemDto Item)? FindItem(
        DisciplineEntryDto entry,
        string? blockId,
        string? itemId,
        string? itemName)
    {
        var blocks = entry.Blocks ?? new List<DisciplineBlockDto>();
        if (!string.IsNullOrWhiteSpace(blockId))
        {
            blocks = blocks
                .Where(b => string.Equals(b.BlockId, blockId, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        foreach (var block in blocks)
        {
            foreach (var item in block.Items ?? new List<DisciplineItemDto>())
            {
                if (!string.IsNullOrWhiteSpace(itemId)
                    && string.Equals(item.ItemId, itemId, StringComparison.OrdinalIgnoreCase))
                {
                    return (block.BlockId, item);
                }

                if (!string.IsNullOrWhiteSpace(itemName)
                    && (item.ItemName?.Contains(itemName.Trim(), StringComparison.OrdinalIgnoreCase) ?? false))
                {
                    return (block.BlockId, item);
                }
            }
        }

        return null;
    }
}
