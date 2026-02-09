using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Discipline;
using POS.Application.DTOs.Today;
using POS.Core.Entities;
using POS.Core.Entities.BetterToday;
using POS.Core.Entities.Deadlines;
using POS.Core.Entities.Diet;
using POS.Core.Entities.Discipline;
using POS.Core.Entities.Schedule;
using POS.Core.Entities.Tasks;
using POS.Infrastructure.Data;
using static POS.Core.Entities.Deadlines.DeadlineStatus;

namespace POS.Application.Services.Today;

/// <summary>
/// Service for aggregating today's data
/// </summary>
public class TodayService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<TodayService> _logger;

    public TodayService(MongoDbContext context, IMapper mapper, ILogger<TodayService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<TodayResponseDto> GetTodayAsync(string userId)
    {
        _logger.LogInformation("Getting today's data for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var todayResponse = new TodayResponseDto
        {
            Day = new DayDto
            {
                Date = today.ToString("yyyy-MM-dd")
            }
        };

        // Get or create Day entity
        var dayFilter = Builders<Day>.Filter.And(
            Builders<Day>.Filter.Eq(d => d.UserId, userId),
            Builders<Day>.Filter.Eq(d => d.Date, today)
        );
        var day = await _context.Days.Find(dayFilter).FirstOrDefaultAsync();
        
        if (day == null)
        {
            day = new Day
            {
                UserId = userId,
                Date = today
            };
            await _context.Days.InsertOneAsync(day);
        }
        todayResponse.Day.Date = day.Date.ToString("yyyy-MM-dd");

        // Get Better Items for today
        var betterItemsFilter = Builders<BetterItem>.Filter.And(
            Builders<BetterItem>.Filter.Eq(bi => bi.UserId, userId),
            Builders<BetterItem>.Filter.Eq(bi => bi.Date, today)
        );
        var betterItems = await _context.BetterItems.Find(betterItemsFilter).ToListAsync();
        todayResponse.BetterItems = betterItems.Select(bi => new BetterItemDto
        {
            Id = bi.Id,
            Title = bi.Title,
            Category = bi.Category,
            Completed = bi.Completed
        }).ToList();

        // Get Tasks for today
        var tasksFilter = Builders<POS.Core.Entities.Tasks.Task>.Filter.And(
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.UserId, userId),
            Builders<POS.Core.Entities.Tasks.Task>.Filter.Eq(t => t.Date, today)
        );
        var tasks = await _context.Tasks.Find(tasksFilter).ToListAsync();
        todayResponse.Tasks = tasks.Select(t => new TaskDto
        {
            Id = t.Id,
            Title = t.Title,
            Category = t.Category,
            Completed = t.Completed
        }).ToList();

        // Get Discipline Entry for today
        DisciplineEntry? discipline = null;
        var disciplineFilter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, today)
        );
        
        try
        {
            discipline = await _context.DisciplineEntries.Find(disciplineFilter).FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            // If deserialization fails (old structure data), delete the old entry
            _logger.LogWarning(ex, "Failed to deserialize discipline entry (likely old structure). Deleting and recreating.");
            try
            {
                await _context.DisciplineEntries.DeleteManyAsync(disciplineFilter);
            }
            catch
            {
                // Ignore delete errors
            }
            discipline = null;
        }
        
        if (discipline != null)
        {
            // Ensure blocks are initialized
            if (discipline.Blocks == null || discipline.Blocks.Count == 0)
            {
                // Initialize default blocks (same as in DisciplineService)
                discipline.Blocks = CreateDefaultBlocks();
                discipline.UpdatedAt = DateTime.UtcNow;
                try
                {
                    await _context.DisciplineEntries.ReplaceOneAsync(disciplineFilter, discipline);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to update discipline entry. Will create new one.");
                    discipline = null;
                }
            }
            
            if (discipline != null)
            {
                try
                {
                    todayResponse.Discipline = _mapper.Map<DisciplineEntryDto>(discipline);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to map discipline entry. Creating new one.");
                    // Delete the problematic entry and create a new one
                    try
                    {
                        await _context.DisciplineEntries.DeleteManyAsync(disciplineFilter);
                    }
                    catch
                    {
                        // Ignore
                    }
                    discipline = null;
                }
            }
        }
        
        if (discipline == null)
        {
            // Create default discipline entry with blocks
            var newDiscipline = new DisciplineEntry
            {
                UserId = userId,
                Date = today,
                Blocks = CreateDefaultBlocks(),
                CreatedAt = DateTime.UtcNow
            };
            try
            {
                await _context.DisciplineEntries.InsertOneAsync(newDiscipline);
                todayResponse.Discipline = _mapper.Map<DisciplineEntryDto>(newDiscipline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create new discipline entry. Creating empty DTO.");
                todayResponse.Discipline = new DisciplineEntryDto
                {
                    Blocks = new List<DisciplineBlockDto>(),
                    Date = today
                };
            }
        }

        // Get Diet Entry for today
        var dietFilter = Builders<DietEntry>.Filter.And(
            Builders<DietEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DietEntry>.Filter.Eq(d => d.Date, today)
        );
        var diet = await _context.DietEntries.Find(dietFilter).FirstOrDefaultAsync();
        
        if (diet != null)
        {
            todayResponse.Diet = new DietEntryDto
            {
                Compliant = diet.Compliant,
                PhotoUri = diet.PhotoUrl,
                Note = diet.Note
            };
        }
        else
        {
            // Create default diet entry
            var newDiet = new DietEntry
            {
                UserId = userId,
                Date = today
            };
            await _context.DietEntries.InsertOneAsync(newDiet);
            todayResponse.Diet = new DietEntryDto();
        }

        // Get current schedule block (first block that hasn't ended)
        var now = DateTime.UtcNow;
        var scheduleBlocksFilter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Date, today)
        );
        var scheduleBlocks = await _context.ScheduleBlockInstances.Find(scheduleBlocksFilter).ToListAsync();
        
        var currentBlock = scheduleBlocks
            .Where(sb => 
            {
                var startTime = TimeSpan.Parse(sb.StartTime);
                var endTime = TimeSpan.Parse(sb.EndTime);
                var currentTime = now.TimeOfDay;
                return startTime <= currentTime && endTime > currentTime;
            })
            .OrderBy(sb => sb.StartTime)
            .FirstOrDefault();
        
        if (currentBlock != null)
        {
            todayResponse.CurrentBlock = new ScheduleBlockDto
            {
                Id = currentBlock.Id,
                Title = currentBlock.Title,
                StartTime = currentBlock.StartTime,
                EndTime = currentBlock.EndTime
            };
        }

        // Get deadline warning (deadlines due within 3 days)
        var threeDaysFromNow = today.AddDays(3);
        var deadlineFilter = Builders<Deadline>.Filter.And(
            Builders<Deadline>.Filter.Eq(d => d.UserId, userId),
            Builders<Deadline>.Filter.Gte(d => d.DueDate, today),
            Builders<Deadline>.Filter.Lte(d => d.DueDate, threeDaysFromNow),
            Builders<Deadline>.Filter.Ne(d => d.Status, Completed)
        );
        var urgentDeadlines = await _context.Deadlines.Find(deadlineFilter).ToListAsync();
        
        var urgentDeadline = urgentDeadlines
            .OrderBy(d => d.DueDate)
            .FirstOrDefault();
        
        if (urgentDeadline != null)
        {
            var daysLeft = (urgentDeadline.DueDate.Date - today).Days;
            todayResponse.DeadlineWarning = new DeadlineWarningDto
            {
                Id = urgentDeadline.Id,
                Title = urgentDeadline.Title,
                DaysLeft = daysLeft,
                Status = urgentDeadline.Status == DeadlineStatus.Behind ? "behind" : "on track"
            };
        }

        return todayResponse;
    }

    /// <summary>
    /// Create default blocks (75 Hard and Habit Tracking)
    /// Same as in DisciplineService
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
}
