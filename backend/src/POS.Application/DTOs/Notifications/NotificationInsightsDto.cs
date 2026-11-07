namespace POS.Application.DTOs.Notifications;

/// <summary>
/// Notification insights DTO for analytics
/// </summary>
public class NotificationInsightsDto
{
    public int TotalNotifications { get; set; }
    public int TaskRelevantCount { get; set; }
    public List<AppNotificationCount> MostActiveApps { get; set; } = new();
    public List<TimeSlotCount> NotificationsByHour { get; set; } = new();
    public List<DayOfWeekCount> NotificationsByDay { get; set; } = new();
}

/// <summary>
/// App notification count
/// </summary>
public class AppNotificationCount
{
    public string PackageName { get; set; } = string.Empty;
    public string? AppName { get; set; }
    public int Count { get; set; }
}

/// <summary>
/// Notification count by hour
/// </summary>
public class TimeSlotCount
{
    public int Hour { get; set; }
    public int Count { get; set; }
}

/// <summary>
/// Notification count by day of week
/// </summary>
public class DayOfWeekCount
{
    public int DayOfWeek { get; set; } // 0 = Sunday, 6 = Saturday
    public string DayName { get; set; } = string.Empty;
    public int Count { get; set; }
}
