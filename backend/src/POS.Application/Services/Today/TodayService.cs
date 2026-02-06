using Microsoft.Extensions.Logging;
using MongoDB.Driver;
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
    private readonly ILogger<TodayService> _logger;

    public TodayService(MongoDbContext context, ILogger<TodayService> logger)
    {
        _context = context;
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
        var disciplineFilter = Builders<DisciplineEntry>.Filter.And(
            Builders<DisciplineEntry>.Filter.Eq(d => d.UserId, userId),
            Builders<DisciplineEntry>.Filter.Eq(d => d.Date, today)
        );
        var discipline = await _context.DisciplineEntries.Find(disciplineFilter).FirstOrDefaultAsync();
        
        if (discipline != null)
        {
            todayResponse.Discipline = new DisciplineEntryDto
            {
                Gym = discipline.Gym,
                Walk = discipline.Walk,
                Cooked = discipline.Cooked,
                Diet = discipline.Diet,
                Meditation = discipline.Meditation,
                Water = discipline.Water
            };
        }
        else
        {
            // Create default discipline entry
            var newDiscipline = new DisciplineEntry
            {
                UserId = userId,
                Date = today
            };
            await _context.DisciplineEntries.InsertOneAsync(newDiscipline);
            todayResponse.Discipline = new DisciplineEntryDto();
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
}
