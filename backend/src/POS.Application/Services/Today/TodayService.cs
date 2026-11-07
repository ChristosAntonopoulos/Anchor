using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Diet;
using POS.Application.DTOs.Discipline;
using POS.Application.DTOs.Today;
using POS.Application.Services.Diet;
using POS.Application.Services.Discipline;
using POS.Core.Entities;
using POS.Core.Entities.BetterToday;
using POS.Core.Entities.Deadlines;
using POS.Core.Entities.Schedule;
using POS.Core.Repositories;
using TaskEntity = POS.Core.Entities.Tasks.Task;

namespace POS.Application.Services.Today;

/// <summary>
/// Aggregates all daily data into a single response.
/// Each domain's data is owned by its own service or repository;
/// TodayService only orchestrates and shapes the response.
/// </summary>
public class TodayService
{
    private readonly IRepository<Day> _dayRepository;
    private readonly IRepository<BetterItem> _betterItemRepository;
    private readonly IRepository<TaskEntity> _taskRepository;
    private readonly IRepository<ScheduleBlockInstance> _scheduleRepository;
    private readonly IRepository<Deadline> _deadlineRepository;
    private readonly DietService _dietService;
    private readonly DisciplineService _disciplineService;
    private readonly ILogger<TodayService> _logger;

    public TodayService(
        IRepository<Day> dayRepository,
        IRepository<BetterItem> betterItemRepository,
        IRepository<TaskEntity> taskRepository,
        IRepository<ScheduleBlockInstance> scheduleRepository,
        IRepository<Deadline> deadlineRepository,
        DietService dietService,
        DisciplineService disciplineService,
        ILogger<TodayService> logger)
    {
        _dayRepository = dayRepository;
        _betterItemRepository = betterItemRepository;
        _taskRepository = taskRepository;
        _scheduleRepository = scheduleRepository;
        _deadlineRepository = deadlineRepository;
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

        // Ensure a Day record exists
        var dayExists = await _dayRepository.ExistsAsync(d => d.UserId == userId && d.Date == today);
        if (!dayExists)
            await _dayRepository.CreateAsync(new Day { UserId = userId, Date = today });

        // Better Items
        var betterItems = await _betterItemRepository.FindAsync(bi => bi.UserId == userId && bi.Date == today);
        todayResponse.BetterItems = betterItems.Select(bi => new BetterItemDto
        {
            Id = bi.Id,
            Title = bi.Title,
            Category = bi.Category,
            Completed = bi.Completed,
        }).ToList();

        // Tasks
        var tasks = await _taskRepository.FindAsync(t => t.UserId == userId && t.Date == today);
        todayResponse.Tasks = tasks.Select(t => new TaskDto
        {
            Id = t.Id,
            Title = t.Title,
            Category = t.Category,
            Completed = t.Completed,
        }).ToList();

        // Discipline and Diet — owned by their services (get-or-create lives there)
        todayResponse.Discipline = await _disciplineService.GetTodayDisciplineAsync(userId);
        todayResponse.Diet = await _dietService.GetTodayDietAsync(userId);

        // Current schedule block (the block whose window contains the current time)
        var now = DateTime.UtcNow;
        var blocks = await _scheduleRepository.FindAsync(sb => sb.UserId == userId && sb.Date == today);
        var currentBlock = blocks
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
                EndTime = currentBlock.EndTime,
            };
        }

        // Deadline warning: nearest non-completed deadline due within 3 days
        var threeDaysFromNow = today.AddDays(3);
        var urgentDeadlines = await _deadlineRepository.FindAsync(d =>
            d.UserId == userId &&
            d.DueDate >= today &&
            d.DueDate <= threeDaysFromNow &&
            d.Status != DeadlineStatus.Completed);

        var urgentDeadline = urgentDeadlines.OrderBy(d => d.DueDate).FirstOrDefault();
        if (urgentDeadline is not null)
        {
            todayResponse.DeadlineWarning = new DeadlineWarningDto
            {
                Id = urgentDeadline.Id,
                Title = urgentDeadline.Title,
                DaysLeft = (urgentDeadline.DueDate.Date - today).Days,
                Status = urgentDeadline.Status == DeadlineStatus.Behind ? "behind" : "on track",
            };
        }

        return todayResponse;
    }
}
