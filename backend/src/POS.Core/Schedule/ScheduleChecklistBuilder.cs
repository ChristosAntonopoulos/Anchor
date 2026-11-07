using POS.Core.Entities.Schedule;

namespace POS.Core.Schedule;

/// <summary>
/// Builds per-day checklists with realistic per-step durations (not equal splits).
/// </summary>
public static class ScheduleChecklistBuilder
{
    public const int CurrentChecklistVersion = 2;

    private sealed record StepTemplate(string Title, int DurationMinutes);

    private static readonly Dictionary<string, int> ActivityDurations = new(StringComparer.OrdinalIgnoreCase)
    {
        ["drink water"] = 2,
        ["hydrate"] = 2,
        ["brush teeth"] = 3,
        ["morning walk"] = 20,
        ["move"] = 15,
        ["plan the day"] = 10,
        ["close screens"] = 5,
        ["read a book"] = 25,
        ["read"] = 25,
        ["wind down"] = 10,
        ["reflect"] = 10,
        ["prepare tomorrow"] = 10,
        ["set intention"] = 5,
        ["deep work"] = 90,
        ["focus"] = 45,
        ["capture notes"] = 10,
        ["wrap up"] = 10,
        ["prepare"] = 5,
        ["review & note"] = 10,
    };

    private static readonly Dictionary<string, StepTemplate[]> TitleTemplates = new(StringComparer.OrdinalIgnoreCase)
    {
        ["morning routine"] =
        [
            new("Drink water", 2),
            new("Brush teeth", 3),
            new("Morning walk", 20),
            new("Plan the day", 10),
        ],
        ["evening routine"] =
        [
            new("Close screens", 5),
            new("Read a book", 25),
            new("Brush teeth", 3),
            new("Prepare tomorrow", 10),
        ],
        ["deep work"] =
        [
            new("Set intention", 5),
            new("Deep work", 90),
            new("Capture notes", 10),
        ],
        ["focused work"] =
        [
            new("Set intention", 5),
            new("Deep work", 90),
            new("Capture notes", 10),
        ],
    };

    public static List<ScheduleChecklistItem> BuildForBlock(ScheduleBlockInstance block)
    {
        var blockMinutes = GetBlockDurationMinutes(block.StartTime, block.EndTime);
        var templates = ResolveTemplates(block);
        var scaled = ScaleTemplatesToBlock(templates, blockMinutes);

        return scaled
            .Select((step, index) => new ScheduleChecklistItem
            {
                Id = Guid.NewGuid().ToString(),
                Title = step.Title,
                DurationMinutes = step.DurationMinutes,
                Completed = false,
                Order = index
            })
            .ToList();
    }

    /// <summary>
    /// Rebuild checklist preserving completion by matching step titles.
    /// </summary>
    public static List<ScheduleChecklistItem> RebuildPreservingCompletion(
        ScheduleBlockInstance block,
        List<ScheduleChecklistItem>? existing)
    {
        var fresh = BuildForBlock(block);
        if (existing is not { Count: > 0 })
            return fresh;

        var completedTitles = existing
            .Where(i => i.Completed)
            .Select(i => i.Title.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var item in fresh)
        {
            if (completedTitles.Contains(item.Title.Trim()))
                item.Completed = true;
        }

        return fresh;
    }

    private static List<StepTemplate> ResolveTemplates(ScheduleBlockInstance block)
    {
        if (TryGetTitleTemplate(block.Title, out var byTitle))
            return byTitle;

        if (block.RoutineActivities is { Count: > 0 })
        {
            return block.RoutineActivities
                .Select(title => new StepTemplate(title, DurationForActivity(title)))
                .ToList();
        }

        return
        [
            new("Prepare", 5),
            new("Focus", Math.Max(15, GetBlockDurationMinutes(block.StartTime, block.EndTime) - 15)),
            new("Wrap up", 10),
        ];
    }

    private static bool TryGetTitleTemplate(string title, out List<StepTemplate> templates)
    {
        templates = [];
        var key = title.Trim();
        if (TitleTemplates.TryGetValue(key, out var exact))
        {
            templates = exact.ToList();
            return true;
        }

        foreach (var (templateKey, steps) in TitleTemplates)
        {
            if (key.Contains(templateKey, StringComparison.OrdinalIgnoreCase))
            {
                templates = steps.ToList();
                return true;
            }
        }

        return false;
    }

    private static int DurationForActivity(string title)
    {
        var trimmed = title.Trim();
        if (ActivityDurations.TryGetValue(trimmed, out var exact))
            return exact;

        foreach (var (key, minutes) in ActivityDurations)
        {
            if (trimmed.Contains(key, StringComparison.OrdinalIgnoreCase))
                return minutes;
        }

        return 10;
    }

    private static List<StepTemplate> ScaleTemplatesToBlock(List<StepTemplate> templates, int blockMinutes)
    {
        if (templates.Count == 0)
            return templates;

        var sum = templates.Sum(t => t.DurationMinutes);
        if (sum <= blockMinutes)
            return templates;

        // Only scale down when templates exceed the block window (keep ratios).
        var scale = (double)blockMinutes / sum;
        var scaled = templates
            .Select(t => new StepTemplate(t.Title, Math.Max(1, (int)Math.Round(t.DurationMinutes * scale))))
            .ToList();

        var scaledSum = scaled.Sum(t => t.DurationMinutes);
        var delta = blockMinutes - scaledSum;
        if (delta != 0)
            scaled[^1] = scaled[^1] with { DurationMinutes = Math.Max(1, scaled[^1].DurationMinutes + delta) };

        return scaled;
    }

    public static int GetBlockDurationMinutes(string startTime, string endTime)
    {
        if (!TimeSpan.TryParse(startTime, out var start) ||
            !TimeSpan.TryParse(endTime, out var end))
            return 30;

        var minutes = (int)(end - start).TotalMinutes;
        return minutes > 0 ? minutes : 30;
    }

    /// <summary>
    /// Detect v1 equal-split checklists (all steps same duration).
    /// </summary>
    public static bool LooksLikeLegacyEqualSplit(List<ScheduleChecklistItem> items)
    {
        if (items.Count < 2) return false;
        var first = items[0].DurationMinutes;
        return items.All(i => i.DurationMinutes == first);
    }
}
