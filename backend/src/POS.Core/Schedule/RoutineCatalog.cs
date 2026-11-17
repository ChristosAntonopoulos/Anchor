namespace POS.Core.Schedule;

/// <summary>
/// Single source of truth for Chris's Morning and Night routines.
/// Schedule blocks and immersive Morning/Night modes both derive from this catalog.
/// Times are device-local (Athens for Chris); windows are configurable via schedule definitions.
/// </summary>
public static class RoutineCatalog
{
    public const string MorningTitle = "Morning Routine";
    public const string EveningTitle = "Evening Routine";
    public const string CatalogVersion = "unify-v1";

    public static readonly UnifiedRoutine Morning = new(
        Key: "morning",
        Title: MorningTitle,
        StartTime: "07:00",
        EndTime: "07:45",
        TriggerHour: 7,
        TriggerMinute: 0,
        TotalSeconds: 1800,
        Steps:
        [
            new RoutineStep("water", "Drink water", 120, "Open curtains if you want. Drink a glass of water."),
            new RoutineStep("move", "Light movement", 300, "Gentle indoor movement: march, shoulders, a few stands, stretch."),
            new RoutineStep("brush", "Brush / hygiene", 240, "Brush teeth and a quick wash."),
            new RoutineStep("settle", "Short settle", 780, "Sit quietly. Soft breath. When the mind wanders, come back."),
            new RoutineStep("task", "First work task", 360, "Do only the first physical move of today's first task."),
        ],
        ShorterSteps:
        [
            new RoutineStep("water", "Drink water", 120, "Drink a glass of water."),
            new RoutineStep("task", "First work task", 360, "Do only the first physical move."),
        ]);

    public static readonly UnifiedRoutine Night = new(
        Key: "night",
        Title: EveningTitle,
        StartTime: "21:30",
        EndTime: "22:15",
        TriggerHour: 21,
        TriggerMinute: 30,
        TotalSeconds: 1800,
        Steps:
        [
            new RoutineStep("screens", "Screens down", 300, "Dim lights. Close feeds and chats. Lower brightness. Phone face-down."),
            new RoutineStep("read", "Short read", 480, "Read a few calm pages. No feeds."),
            new RoutineStep("brush", "Brush teeth", 180, "Wash up / brush teeth gently."),
            new RoutineStep("breathe", "Quiet breath", 180, "Soft nose inhale count four, longer exhale count six. Two quiet rounds."),
            new RoutineStep("close", "Tomorrow first step", 660, "Write one small first step for tomorrow. Phone charging away from bed."),
        ],
        ShorterSteps:
        [
            new RoutineStep("screens", "Screens down", 300, "Close screens. Phone face-down."),
            new RoutineStep("breathe", "Quiet breath", 180, "Two quiet breath rounds."),
            new RoutineStep("close", "Tomorrow first step", 660, "One tomorrow step. Phone away."),
        ]);

    public static UnifiedRoutine ForTitle(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
            return Morning;

        if (title.Contains("evening", StringComparison.OrdinalIgnoreCase) ||
            title.Contains("night", StringComparison.OrdinalIgnoreCase))
            return Night;

        return Morning;
    }

    public static bool IsMorningTitle(string? title) =>
        !string.IsNullOrWhiteSpace(title) &&
        title.Contains("morning", StringComparison.OrdinalIgnoreCase);

    public static bool IsEveningTitle(string? title) =>
        !string.IsNullOrWhiteSpace(title) &&
        (title.Contains("evening", StringComparison.OrdinalIgnoreCase) ||
         title.Contains("night", StringComparison.OrdinalIgnoreCase));
}

public sealed record UnifiedRoutine(
    string Key,
    string Title,
    string StartTime,
    string EndTime,
    int TriggerHour,
    int TriggerMinute,
    int TotalSeconds,
    IReadOnlyList<RoutineStep> Steps,
    IReadOnlyList<RoutineStep> ShorterSteps)
{
    public IReadOnlyList<string> ActivityTitles => Steps.Select(s => s.Title).ToList();
    public IReadOnlyList<string> ShorterActivityTitles => ShorterSteps.Select(s => s.Title).ToList();

    public int DurationMinutes
    {
        get
        {
            if (!TimeSpan.TryParse(StartTime, out var start) || !TimeSpan.TryParse(EndTime, out var end))
                return TotalSeconds / 60;
            var minutes = (int)(end - start).TotalMinutes;
            return minutes > 0 ? minutes : TotalSeconds / 60;
        }
    }
}

public sealed record RoutineStep(string Id, string Title, int Seconds, string Command);
