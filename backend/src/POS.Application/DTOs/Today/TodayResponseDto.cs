namespace POS.Application.DTOs.Today;

/// <summary>
/// Today response DTO - aggregates all daily data
/// Matches GET /api/today response structure exactly
/// </summary>
public class TodayResponseDto
{
    public DayDto Day { get; set; } = new();
    public List<BetterItemDto> BetterItems { get; set; } = new();
    public List<TaskDto> Tasks { get; set; } = new();
    public DisciplineEntryDto Discipline { get; set; } = new();
    public DietEntryDto Diet { get; set; } = new();
    public ScheduleBlockDto CurrentBlock { get; set; } = new();
    public DeadlineWarningDto? DeadlineWarning { get; set; }
}
