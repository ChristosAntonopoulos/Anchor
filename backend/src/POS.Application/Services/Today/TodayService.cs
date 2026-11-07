using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Diet;
using POS.Application.DTOs.Discipline;
using POS.Application.DTOs.Today;
using POS.Application.Services.Diet;
using POS.Application.Services.Discipline;
using POS.Core.Entities;
using POS.Core.Entities.BetterToday;
using POS.Core.Entities.Deadlines;
using POS.Core.Entities.Schedule;
using POS.Infrastructure.Data;
using static POS.Core.Entities.Deadlines.DeadlineStatus;

namespace POS.Application.Services.Today;

/// <summary>
/// Service for aggregating today's data into a single response.
/// Delegates diet and discipline lookups to their own services to avoid duplication.
/// </summary>
public class TodayService
{
    private readonly MongoDbContext _context;
    private readonly DietService _dietService;
    private readonly DisciplineService _disciplineService;
    private readonly ILogger<TodayService> _logger;

    public TodayService(
        MongoDbContext context,
        DietService dietService,
        DisciplineService disciplineService,
        ILogger<TodayService> logger)
    {
        _context = context;
        _dietService = dietService;
        _disciplineService = disciplineService;
        _logger = logger;
    }

    public async Task<TodayResponseDto> GetTodayAsync(string userId)
    {
        _logger.LogInformation("Getting today's data for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;

        var todayResponse = new TodayResponseDto
        {
            Day = new DayDto { Date = today.ToString("yyyy-MM-dd") }
        };

        // Ensure a Day record exists for today
        var dayFilter = Builders<Day>.Filter.And(
            Builders<Day>.Filter.Eq(d => d.UserId, userId),
            Builders<Day>.Filter.Eq(d => d.Date, today)
        );
        if (await _context.Days.Find(dayFilter).FirstOrDefaultAsync() is null)
        {
            await _context.Days.InsertOneAsync(new Day { UserId = userId, Date = today });
        }

        // Better Items
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

        // Tasks
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

        // Discipline — delegate to DisciplineService (get-or-create lives there)
        todayResponse.Discipline = await _disciplineService.GetTodayDisciplineAsync(userId);

        // Diet — delegate to DietService (get-or-create lives there)
        todayResponse.Diet = await _dietService.GetTodayDietAsync(userId);

        // Current schedule block (the block whose window contains the current time)
        var now = DateTime.UtcNow;
        var scheduleFilter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Date, today)
        );
        var scheduleBlocks = await _context.ScheduleBlockInstances.Find(scheduleFilter).ToListAsync();

        var currentBlock = scheduleBlocks
            .Where(sb =>
            {
                var start = TimeSpan.Parse(sb.StartTime);
                var end = TimeSpan.Parse(sb.EndTime);
                return start <= now.TimeOfDay && now.TimeOfDay < end;
            })
            .OrderBy(sb => sb.StartTime)
            .FirstOrDefault();

        if (currentBlock is not null)
        {
            todayResponse.CurrentBlock = new ScheduleBlockDto
            {
                Id = currentBlock.Id,
                Title = currentBlock.Title,
                StartTime = currentBlock.StartTime,
                EndTime = currentBlock.EndTime
            };
        }

        // Deadline warning: nearest non-completed deadline due within 3 days
        var threeDaysFromNow = today.AddDays(3);
        var deadlineFilter = Builders<Deadline>.Filter.And(
            Builders<Deadline>.Filter.Eq(d => d.UserId, userId),
            Builders<Deadline>.Filter.Gte(d => d.DueDate, today),
            Builders<Deadline>.Filter.Lte(d => d.DueDate, threeDaysFromNow),
            Builders<Deadline>.Filter.Ne(d => d.Status, Completed)
        );
        var urgentDeadlines = await _context.Deadlines.Find(deadlineFilter).ToListAsync();

        var urgentDeadline = urgentDeadlines.OrderBy(d => d.DueDate).FirstOrDefault();
        if (urgentDeadline is not null)
        {
            todayResponse.DeadlineWarning = new DeadlineWarningDto
            {
                Id = urgentDeadline.Id,
                Title = urgentDeadline.Title,
                DaysLeft = (urgentDeadline.DueDate.Date - today).Days,
                Status = urgentDeadline.Status == DeadlineStatus.Behind ? "behind" : "on track"
            };
        }

        return todayResponse;
    }
}
