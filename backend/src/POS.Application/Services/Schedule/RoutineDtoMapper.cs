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
            ["taskMicroIndex"] = 0,
            ["seatedMovement"] = false,
            ["breathingEnabled"] = true,
            ["shorter"] = false,
            ["settleActualSeconds"] = null,
            // Morning immersive timers require brush substeps; omit → client crash on brush.
            ["brush"] = mode == "morning"
                ? new object[]
                {
                    new { id = "teeth", seconds = 120, command = "Brush your teeth." },
                    new { id = "wash", seconds = 120, command = "Quick wash of face and hands." },
                }
                : Array.Empty<object>(),
        };

        return JsonSerializer.SerializeToElement(payload);
    }

    /// <summary>
    /// Ensure stored morning session JSON has required optional arrays (e.g. brush)
    /// so clients never see undefined.length on step timers.
    /// </summary>
    public static JsonElement NormalizeMorningSessionPayload(JsonElement session)
    {
        Dictionary<string, JsonElement> map;
        try
        {
            map = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(session.GetRawText())
                  ?? new Dictionary<string, JsonElement>();
        }
        catch
        {
            return session;
        }

        if (!map.TryGetValue("brush", out var brushEl) ||
            brushEl.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined ||
            (brushEl.ValueKind == JsonValueKind.Array && brushEl.GetArrayLength() == 0))
        {
            map["brush"] = JsonSerializer.SerializeToElement(new object[]
            {
                new { id = "teeth", seconds = 120, command = "Brush your teeth." },
                new { id = "wash", seconds = 120, command = "Quick wash of face and hands." },
            });
        }

        if (!map.ContainsKey("completedSteps") || map["completedSteps"].ValueKind != JsonValueKind.Array)
            map["completedSteps"] = JsonSerializer.SerializeToElement(Array.Empty<string>());
        if (!map.ContainsKey("skippedSteps") || map["skippedSteps"].ValueKind != JsonValueKind.Array)
            map["skippedSteps"] = JsonSerializer.SerializeToElement(Array.Empty<string>());
        if (!map.ContainsKey("currentSubstep") || map["currentSubstep"].ValueKind != JsonValueKind.Number)
            map["currentSubstep"] = JsonSerializer.SerializeToElement(0);
        else
        {
            var sub = map["currentSubstep"].GetInt32();
            if (sub < 0) map["currentSubstep"] = JsonSerializer.SerializeToElement(0);
        }

        return JsonSerializer.SerializeToElement(map);
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
