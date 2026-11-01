namespace POS.Application.DTOs.Tasks;

/// <summary>
/// RecurrencePattern DTO
/// </summary>
public class RecurrencePatternDto
{
    public string Type { get; set; } = string.Empty; // daily|weekly|monthly|yearly
    public int? Interval { get; set; }
    public List<int>? DaysOfWeek { get; set; }
    public int? DayOfMonth { get; set; }
    public DateTime? EndDate { get; set; }
    public int? OccurrenceCount { get; set; }
}
