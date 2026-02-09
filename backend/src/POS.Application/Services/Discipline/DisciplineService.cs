using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Discipline;
using POS.Core.Entities.Discipline;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Discipline;

/// <summary>
/// Service for managing discipline entries
/// </summary>
public class DisciplineService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<DisciplineService> _logger;

    public DisciplineService(MongoDbContext context, IMapper mapper, ILogger<DisciplineService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get today's discipline entry
    /// </summary>
    public async Task<DisciplineEntryDto> GetTodayDisciplineAsync(string userId)
    {
        _logger.LogInformation("Getting today's discipline entry for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, today)
        );
        
        var discipline = await _context.DisciplineEntries.Find(filter).FirstOrDefaultAsync();
        
        if (discipline == null)
        {
            // Create default discipline entry with default blocks
            discipline = CreateDefaultDisciplineEntry(userId, today);
            await _context.DisciplineEntries.InsertOneAsync(discipline);
        }
        else if (discipline.Blocks == null || discipline.Blocks.Count == 0)
        {
            // Initialize blocks if entry exists but has no blocks (migration case)
            discipline.Blocks = CreateDefaultBlocks();
            discipline.UpdatedAt = DateTime.UtcNow;
            await _context.DisciplineEntries.ReplaceOneAsync(filter, discipline);
        }
        
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    /// <summary>
    /// Create default discipline entry with default blocks
    /// </summary>
    private DisciplineEntry CreateDefaultDisciplineEntry(string userId, DateTime date)
    {
        return new DisciplineEntry
        {
            UserId = userId,
            Date = date,
            Blocks = CreateDefaultBlocks(),
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Create default blocks (75 Hard and Habit Tracking)
    /// </summary>
    private List<DisciplineBlock> CreateDefaultBlocks()
    {
        return new List<DisciplineBlock>
        {
            // 75 Hard Block
            new DisciplineBlock
            {
                BlockId = "75Hard",
                BlockName = "75 Hard",
                Order = 0,
                Items = new List<DisciplineItem>
                {
                    new DisciplineItem { ItemId = "DietFollowed", ItemName = "Diet followed (no cheat meals, no alcohol)", Type = DisciplineItemType.Toggle, ToggleValue = false },
                    new DisciplineItem { ItemId = "Workout1", ItemName = "Workout #1 (45 min)", Type = DisciplineItemType.Toggle, ToggleValue = false },
                    new DisciplineItem { ItemId = "Workout2", ItemName = "Workout #2 (45 min – outdoor)", Type = DisciplineItemType.Toggle, ToggleValue = false },
                    new DisciplineItem { ItemId = "GallonWater", ItemName = "1 gallon water", Type = DisciplineItemType.Toggle, ToggleValue = false },
                    new DisciplineItem { ItemId = "Read10Pages", ItemName = "Read 10 pages nonfiction", Type = DisciplineItemType.Toggle, ToggleValue = false },
                    new DisciplineItem { ItemId = "ProgressPhoto", ItemName = "Progress photo", Type = DisciplineItemType.Toggle, ToggleValue = false }
                }
            },
            // Habit Tracking Block
            new DisciplineBlock
            {
                BlockId = "HabitTracking",
                BlockName = "Habit Tracking",
                Order = 1,
                Items = new List<DisciplineItem>
                {
                    new DisciplineItem { ItemId = "PrivateActivity", ItemName = "Private Activity", Type = DisciplineItemType.Counter, CounterValue = 0 },
                    new DisciplineItem { ItemId = "Cigarettes", ItemName = "Cigarettes", Type = DisciplineItemType.Counter, CounterValue = 0 },
                    new DisciplineItem { ItemId = "Coffee", ItemName = "Coffee", Type = DisciplineItemType.Counter, CounterValue = 0 }
                }
            }
        };
    }

    /// <summary>
    /// Update today's discipline entry (general update, e.g., note)
    /// </summary>
    public async Task<DisciplineEntryDto> UpdateDisciplineAsync(UpdateDisciplineRequest request, string userId)
    {
        _logger.LogInformation("Updating discipline entry for user {UserId}", userId);
        
        var today = DateTime.UtcNow.Date;
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, today)
        );
        
        var discipline = await _context.DisciplineEntries.Find(filter).FirstOrDefaultAsync();
        
        if (discipline == null)
        {
            discipline = CreateDefaultDisciplineEntry(userId, today);
        }
        else if (discipline.Blocks == null || discipline.Blocks.Count == 0)
        {
            discipline.Blocks = CreateDefaultBlocks();
        }

        // Update note if provided
        if (request.Note != null)
            discipline.Note = request.Note;

        discipline.UpdatedAt = DateTime.UtcNow;
        
        if (string.IsNullOrEmpty(discipline.Id))
        {
            await _context.DisciplineEntries.InsertOneAsync(discipline);
        }
        else
        {
            await _context.DisciplineEntries.ReplaceOneAsync(filter, discipline);
        }
        
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    /// <summary>
    /// Update a toggle item
    /// </summary>
    public async Task<DisciplineEntryDto> UpdateToggleAsync(string userId, DateTime date, string blockId, string itemId, bool value)
    {
        _logger.LogInformation("Updating toggle {BlockId}/{ItemId} to {Value} for user {UserId}", blockId, itemId, value, userId);
        
        var discipline = await GetOrCreateDisciplineEntryAsync(userId, date);
        var block = discipline.Blocks.FirstOrDefault(b => b.BlockId == blockId);
        if (block == null)
        {
            throw new ArgumentException($"Block {blockId} not found");
        }
        
        var item = block.Items.FirstOrDefault(i => i.ItemId == itemId);
        if (item == null)
        {
            throw new ArgumentException($"Item {itemId} not found in block {blockId}");
        }
        
        if (item.Type != DisciplineItemType.Toggle)
        {
            throw new ArgumentException($"Item {itemId} is not a toggle item");
        }
        
        item.ToggleValue = value;
        discipline.UpdatedAt = DateTime.UtcNow;
        
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, date)
        );
        
        await _context.DisciplineEntries.ReplaceOneAsync(filter, discipline);
        
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    /// <summary>
    /// Increment a counter item
    /// </summary>
    public async Task<DisciplineEntryDto> IncrementCounterAsync(string userId, DateTime date, string blockId, string itemId)
    {
        _logger.LogInformation("Incrementing counter {BlockId}/{ItemId} for user {UserId}", blockId, itemId, userId);
        
        var discipline = await GetOrCreateDisciplineEntryAsync(userId, date);
        var block = discipline.Blocks.FirstOrDefault(b => b.BlockId == blockId);
        if (block == null)
        {
            throw new ArgumentException($"Block {blockId} not found");
        }
        
        var item = block.Items.FirstOrDefault(i => i.ItemId == itemId);
        if (item == null)
        {
            throw new ArgumentException($"Item {itemId} not found in block {blockId}");
        }
        
        if (item.Type != DisciplineItemType.Counter)
        {
            throw new ArgumentException($"Item {itemId} is not a counter item");
        }
        
        item.CounterValue = (item.CounterValue ?? 0) + 1;
        discipline.UpdatedAt = DateTime.UtcNow;
        
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, date)
        );
        
        await _context.DisciplineEntries.ReplaceOneAsync(filter, discipline);
        
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    /// <summary>
    /// Decrement a counter item
    /// </summary>
    public async Task<DisciplineEntryDto> DecrementCounterAsync(string userId, DateTime date, string blockId, string itemId)
    {
        _logger.LogInformation("Decrementing counter {BlockId}/{ItemId} for user {UserId}", blockId, itemId, userId);
        
        var discipline = await GetOrCreateDisciplineEntryAsync(userId, date);
        var block = discipline.Blocks.FirstOrDefault(b => b.BlockId == blockId);
        if (block == null)
        {
            throw new ArgumentException($"Block {blockId} not found");
        }
        
        var item = block.Items.FirstOrDefault(i => i.ItemId == itemId);
        if (item == null)
        {
            throw new ArgumentException($"Item {itemId} not found in block {blockId}");
        }
        
        if (item.Type != DisciplineItemType.Counter)
        {
            throw new ArgumentException($"Item {itemId} is not a counter item");
        }
        
        var currentValue = item.CounterValue ?? 0;
        item.CounterValue = Math.Max(0, currentValue - 1);
        discipline.UpdatedAt = DateTime.UtcNow;
        
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, date)
        );
        
        await _context.DisciplineEntries.ReplaceOneAsync(filter, discipline);
        
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    /// <summary>
    /// Set counter to specific value
    /// </summary>
    public async Task<DisciplineEntryDto> SetCounterAsync(string userId, DateTime date, string blockId, string itemId, int value)
    {
        _logger.LogInformation("Setting counter {BlockId}/{ItemId} to {Value} for user {UserId}", blockId, itemId, value, userId);
        
        var discipline = await GetOrCreateDisciplineEntryAsync(userId, date);
        var block = discipline.Blocks.FirstOrDefault(b => b.BlockId == blockId);
        if (block == null)
        {
            throw new ArgumentException($"Block {blockId} not found");
        }
        
        var item = block.Items.FirstOrDefault(i => i.ItemId == itemId);
        if (item == null)
        {
            throw new ArgumentException($"Item {itemId} not found in block {blockId}");
        }
        
        if (item.Type != DisciplineItemType.Counter)
        {
            throw new ArgumentException($"Item {itemId} is not a counter item");
        }
        
        item.CounterValue = Math.Max(0, value);
        discipline.UpdatedAt = DateTime.UtcNow;
        
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, date)
        );
        
        await _context.DisciplineEntries.ReplaceOneAsync(filter, discipline);
        
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    /// <summary>
    /// Get or create discipline entry for a specific date
    /// </summary>
    private async Task<DisciplineEntry> GetOrCreateDisciplineEntryAsync(string userId, DateTime date)
    {
        var filter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, date.Date)
        );
        
        var discipline = await _context.DisciplineEntries.Find(filter).FirstOrDefaultAsync();
        
        if (discipline == null)
        {
            discipline = CreateDefaultDisciplineEntry(userId, date.Date);
            await _context.DisciplineEntries.InsertOneAsync(discipline);
        }
        else if (discipline.Blocks == null || discipline.Blocks.Count == 0)
        {
            discipline.Blocks = CreateDefaultBlocks();
            discipline.UpdatedAt = DateTime.UtcNow;
            await _context.DisciplineEntries.ReplaceOneAsync(filter, discipline);
        }
        
        return discipline;
    }
}
