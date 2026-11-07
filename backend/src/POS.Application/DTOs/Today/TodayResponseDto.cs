using POS.Application.DTOs.AIBrief;
using POS.Application.DTOs.Day;
using POS.Application.DTOs.Diet;
using POS.Application.DTOs.Discipline;
using POS.Application.DTOs.Tasks;

namespace POS.Application.DTOs.Today;

/// <summary>
/// Today response DTO - aggregates all daily data.
/// Matches GET /api/today response structure exactly.
/// </summary>
public class TodayResponseDto
{
    public DayDto Day { get; set; } = new();
    public DayBootstrapDto DayBootstrap { get; set; } = new();
    public List<BetterItemDto> BetterItems { get; set; } = new();
    public List<TaskDto> Tasks { get; set; } = new();
    public DisciplineEntryDto Discipline { get; set; } = new();
    public DietEntryDto Diet { get; set; } = new();
    public ScheduleBlockDto CurrentBlock { get; set; } = new();
    public DeadlineWarningDto? DeadlineWarning { get; set; }

    /// <summary>
    /// AI-generated daily brief from BotSystem's day-start bot. Null when the bot
    /// has not yet run today (first run of the day before 8 AM).
    /// </summary>
    public DayStartPlanDto? AiBrief { get; set; }
}
