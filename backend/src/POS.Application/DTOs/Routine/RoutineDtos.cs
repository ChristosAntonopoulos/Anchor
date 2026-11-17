using System.Text.Json;

namespace POS.Application.DTOs.Routine;

public class RoutineStepDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int Seconds { get; set; }
    public string Command { get; set; } = string.Empty;
}

public class UnifiedRoutineDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int TriggerHour { get; set; }
    public int TriggerMinute { get; set; }
    public int TotalSeconds { get; set; }
    public string CatalogVersion { get; set; } = string.Empty;
    public List<RoutineStepDto> Steps { get; set; } = [];
    public List<RoutineStepDto> ShorterSteps { get; set; } = [];
    public List<string> ActivityTitles { get; set; } = [];
    public List<string> ShorterActivityTitles { get; set; } = [];
}

public class ModeSessionResponseDto
{
    /// <summary>
    /// Stored session payload when present; otherwise a clear waiting shell for today.
    /// </summary>
    public JsonElement Session { get; set; }

    public UnifiedRoutineDto Routine { get; set; } = new();

    public bool HasStoredSession { get; set; }
}
