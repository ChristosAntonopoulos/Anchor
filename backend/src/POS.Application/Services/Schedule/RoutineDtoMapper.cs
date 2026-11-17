using System.Text.Json;
using POS.Application.DTOs.Routine;
using POS.Core.Schedule;

namespace POS.Application.Services.Schedule;

public static class RoutineDtoMapper
{
    public static UnifiedRoutineDto FromCatalog(UnifiedRoutine routine) =>
        new()
        {
            Key = routine.Key,
            Title = routine.Title,
            StartTime = routine.StartTime,
            EndTime = routine.EndTime,
            TriggerHour = routine.TriggerHour,
            TriggerMinute = routine.TriggerMinute,
            TotalSeconds = routine.TotalSeconds,
            CatalogVersion = RoutineCatalog.CatalogVersion,
            Steps = routine.Steps.Select(ToStep).ToList(),
            ShorterSteps = routine.ShorterSteps.Select(ToStep).ToList(),
            ActivityTitles = routine.ActivityTitles.ToList(),
            ShorterActivityTitles = routine.ShorterActivityTitles.ToList(),
        };

    public static JsonElement ClearWaitingShell(
        string mode,
        string localDate,
        string? timezone,
        int triggerHour,
        int triggerMinute)
    {
        var tz = string.IsNullOrWhiteSpace(timezone) ? "UTC" : timezone.Trim();
        var now = DateTime.UtcNow;
        var status = IsAtOrAfterTrigger(now, triggerHour, triggerMinute)
            ? "WAITING_FOR_FIRST_UNLOCK"
            : "NOT_DUE";

        var firstStep = mode == "night" ? "screens" : "water";
        var payload = new Dictionary<string, object?>
        {
            ["id"] = $"{mode}-{localDate}",
            ["localDate"] = localDate,
            ["timezone"] = tz,
            ["status"] = status,
            ["firstEligibleUnlockAt"] = null,
            ["activationAt"] = null,
            ["currentStep"] = firstStep,
            ["currentSubstep"] = 0,
            ["stepElapsedSeconds"] = 0,
            ["sessionElapsedSeconds"] = 0,
            ["pauseAccumulatedSeconds"] = 0,
            ["completedSteps"] = Array.Empty<string>(),
            ["skippedSteps"] = Array.Empty<string>(),
            ["helpText"] = null,
            ["endedReason"] = null,
            ["confirmEnd"] = false,
            ["pinEnabled"] = false,
            ["chimePlayed"] = false,
            ["lastSpokenKey"] = null,
            ["catalogVersion"] = RoutineCatalog.CatalogVersion,
            ["updatedAt"] = now.ToString("o"),
        };

        return JsonSerializer.SerializeToElement(payload);
    }

    private static RoutineStepDto ToStep(RoutineStep step) =>
        new()
        {
            Id = step.Id,
            Title = step.Title,
            Seconds = step.Seconds,
            Command = step.Command,
        };

    private static bool IsAtOrAfterTrigger(DateTime utcNow, int hour, int minute)
    {
        // Waiting shell uses UTC clock as a coarse fallback; device TZ owns real gating.
        var minutes = utcNow.Hour * 60 + utcNow.Minute;
        return minutes >= hour * 60 + minute;
    }
}
