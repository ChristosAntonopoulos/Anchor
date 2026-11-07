using POS.Core.Entities.Execution;
using POS.Core.Entities.Schedule;
using TaskEntity = POS.Core.Entities.Tasks.Task;

namespace POS.Application.Services.Execution;

internal static class ExecutionHeuristics
{
    public static bool LooksSimple(TaskEntity task)
    {
        var title = task.Title.Trim();
        if (title.Length == 0)
        {
            return true;
        }

        var words = title.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return words.Length <= 2 && string.IsNullOrWhiteSpace(task.Notes) && (task.Subtasks == null || task.Subtasks.Count == 0);
    }

    public static AiPlanTaskResult PlanTask(TaskEntity task)
    {
        if (LooksSimple(task))
        {
            return new AiPlanTaskResult
            {
                Status = "suggestion",
                NextAction = new AiNextAction
                {
                    Text = task.Title.Trim(),
                    EstimatedMinutes = task.EstimatedMinutes,
                    EstimateBasis = task.EstimatedMinutes.HasValue ? "user" : "unknown",
                },
                Reason = "This is small enough to do as written.",
            };
        }

        var title = task.Title.Trim();
        return new AiPlanTaskResult
        {
            Status = "suggestion",
            NextAction = new AiNextAction
            {
                Text = $"Open the work for “{title}” and write the first three headings or next facts.",
                EstimatedMinutes = 5,
                EstimateBasis = "rough_ai_estimate",
            },
            UpcomingSteps =
            [
                "Add one concrete example or number.",
                "Mark what is still missing.",
            ],
            DefinitionOfDone = string.IsNullOrWhiteSpace(task.Notes) ? null : "The next person (including you later) can continue from the notes without reconstructing the task.",
            Reason = "Start with a visible piece of the work rather than more planning.",
            Assumptions = ["The needed files or notes are already available."],
        };
    }

    public static AiNowResult RecommendNow(
        IReadOnlyList<TaskEntity> candidates,
        IReadOnlySet<string> rejected,
        int startMinutes,
        string windowReason,
        bool easier)
    {
        var ordered = candidates
            .Where(t => !rejected.Contains(t.Id))
            .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
            .ThenBy(t => t.FocusRank ?? 99)
            .ThenBy(t => t.CreatedAt)
            .ToList();

        if (easier)
        {
            ordered = ordered
                .OrderBy(t => LooksSimple(t) ? 0 : 1)
                .ThenBy(t => t.DueDate ?? DateTime.MaxValue)
                .ToList();
        }

        var first = ordered.FirstOrDefault();
        var alt = ordered.Skip(1).FirstOrDefault();
        if (first == null)
        {
            return new AiNowResult
            {
                NextAction = "No work task fits this window. Capture one next action or take a short break.",
                SuggestedStartMinutes = startMinutes,
                Reason = windowReason,
            };
        }

        return new AiNowResult
        {
            TaskId = first.Id,
            NextAction = first.NextAction?.Text ?? first.Title,
            SuggestedStartMinutes = startMinutes,
            Reason = windowReason,
            AlternativeTaskId = alt?.Id,
        };
    }

    public static AiStuckResult Stuck(TaskEntity? task, string? choice, bool makeSmaller, int stuckCount, string? lastApproach)
    {
        var action = task?.NextAction?.Text ?? task?.Title ?? "the current step";
        if (makeSmaller)
        {
            if (stuckCount >= 2 && lastApproach == "smaller")
            {
                return new AiStuckResult
                {
                    Approach = "defer",
                    SuggestedAction = "Leave this for now and pick a different task you can start in two minutes.",
                    Explanation = "Shrinking this again is unlikely to help. Stopping is a valid choice.",
                    Alternative = $"Write one messy sentence about {action}, then stop.",
                };
            }

            return new AiStuckResult
            {
                Approach = "smaller",
                SuggestedAction = $"Open the work for “{action}” without editing it, then write one rough line.",
                SuggestedMinutes = 2,
                Explanation = "A two-minute start is enough to see the actual next move.",
            };
        }

        return choice switch
        {
            "unclear" => new AiStuckResult
            {
                Approach = "clarify",
                SuggestedAction = $"Write one sentence: the outcome I want from “{action}” is ___.",
                SuggestedMinutes = 3,
                Explanation = "Name the outcome before doing more work.",
            },
            "too_large" => new AiStuckResult
            {
                Approach = "smaller",
                SuggestedAction = $"Do only the first visible piece of “{action}” for two minutes.",
                SuggestedMinutes = 2,
                Explanation = "Keep the rest of the task untouched.",
            },
            "missing" => new AiStuckResult
            {
                Approach = "dependency",
                SuggestedAction = "Find the missing document or note the exact thing you need, then stop.",
                SuggestedMinutes = 5,
                Explanation = "Unblock the next action instead of pushing through.",
            },
            "worried" => new AiStuckResult
            {
                Approach = "rough",
                SuggestedAction = "Write an intentionally rough first sentence, then leave it.",
                SuggestedMinutes = 3,
                Explanation = "A draft that is allowed to be bad still moves the work.",
            },
            "distracted" => new AiStuckResult
            {
                Approach = "distraction",
                SuggestedAction = "Capture the distracting thought in one line and return to the current action.",
                SuggestedMinutes = 1,
                Explanation = "Park it so you do not have to hold it.",
            },
            "no_time" => new AiStuckResult
            {
                Approach = "defer",
                SuggestedAction = "Leave this for a later window and write the return point in one line.",
                Explanation = "A short window does not have to absorb this task.",
            },
            _ => new AiStuckResult
            {
                Approach = "preparatory",
                SuggestedAction = $"Set out the file or note for “{action}” and write the next heading.",
                SuggestedMinutes = 5,
                Explanation = "A preparatory action is useful only if it makes the next start obvious.",
            },
        };
    }

    public static AiDayPlanResult PlanDay(
        IReadOnlyList<TaskEntity> tasks,
        IReadOnlyList<(TimeSpan Start, TimeSpan End)> windows,
        string timezone,
        int startMinutes,
        DateTime localNow)
    {
        var remaining = tasks.Take(3).ToList();
        var blocks = new List<AiProposedBlock>();
        var used = new HashSet<string>();
        foreach (var window in windows)
        {
            if (blocks.Count >= 3)
            {
                break;
            }

            if (window.End <= localNow.TimeOfDay.Add(TimeSpan.FromMinutes(5)))
            {
                continue;
            }

            var start = window.Start > localNow.TimeOfDay ? window.Start : Align(localNow.TimeOfDay.Add(TimeSpan.FromMinutes(5)));
            if (start >= window.End)
            {
                continue;
            }

            var end = start.Add(TimeSpan.FromMinutes(Math.Min(45, (window.End - start).TotalMinutes)));
            if (end > window.End)
            {
                end = window.End;
            }

            var task = remaining.FirstOrDefault(t => !used.Contains(t.Id));
            if (task == null)
            {
                break;
            }

            used.Add(task.Id);
            blocks.Add(new AiProposedBlock
            {
                TaskId = task.Id,
                StartLocal = Format(start),
                EndLocal = Format(end),
                Timezone = timezone,
                EntryAction = task.NextAction?.Text ?? task.Title,
                StartMinutes = startMinutes,
                Reason = "Next available window after fixed commitments.",
                EstimateUncertain = !task.EstimatedMinutes.HasValue,
            });
        }

        return new AiDayPlanResult
        {
            Summary = blocks.Count == 0
                ? "No open window is long enough to reserve. Keep the first task unscheduled and start a short session when you have a few minutes."
                : "A light plan: one first task and a small number of work blocks, with room left unscheduled.",
            FirstTaskId = blocks.FirstOrDefault()?.TaskId ?? remaining.FirstOrDefault()?.Id,
            ProposedBlocks = blocks,
            UnscheduledTaskIds = remaining.Where(t => !used.Contains(t.Id)).Select(t => t.Id).ToList(),
            Assumptions = ["Windows are local clock times. Fixed commitments were left in place."],
        };
    }

    public static AiReturnPointResult ReturnPoint(TaskEntity? task, WorkSession? session)
    {
        var existing = task?.NextAction?.Text ?? task?.Title ?? "the current action";
        var notes = session?.Notes ?? task?.Notes;
        if (string.IsNullOrWhiteSpace(notes) && string.IsNullOrWhiteSpace(session?.ReturnPoint))
        {
            return new AiReturnPointResult
            {
                ReturnPoint = task?.ReturnPoint ?? $"Pick up: {existing}",
                NextAction = existing,
                Question = "Where should we pick up?",
            };
        }

        return new AiReturnPointResult
        {
            ReturnPoint = session?.ReturnPoint ?? $"Draft exists. Next: continue {existing}.",
            NextAction = existing,
        };
    }

    public static AiAdaptRoutineResult AdaptRoutine(IReadOnlyList<string> regular, IReadOnlyList<string> shorter, string? capacity)
    {
        var tight = capacity is "5" or "15";
        return new AiAdaptRoutineResult
        {
            RecommendedVersion = tight ? (shorter.Count > 0 ? "shorter" : "skip") : "regular",
            Reason = tight
                ? "A shorter version keeps the sequence useful when time is tight."
                : "There is enough room for the regular sequence.",
            SuggestedShorterSteps = shorter.Count > 0 ? shorter.ToList() : regular.Take(2).ToList(),
        };
    }

    public static AiReviewResult Review(int missedBlocks, int finishedSessions, int stuckCount)
    {
        var observations = new List<string>();
        if (finishedSessions > 0)
        {
            observations.Add($"{finishedSessions} session(s) were finished recently.");
        }

        if (missedBlocks > 0)
        {
            observations.Add($"{missedBlocks} reserved window(s) ended without a linked session.");
        }

        if (stuckCount > 0)
        {
            observations.Add($"Stuck help was used {stuckCount} time(s).");
        }

        var hypotheses = new List<string>();
        if (missedBlocks > finishedSessions && missedBlocks > 0)
        {
            hypotheses.Add("Shorter starts inside reserved windows may fit better than filling the whole block. This is a guess, not a conclusion.");
        }

        return new AiReviewResult
        {
            Observations = observations,
            Hypotheses = hypotheses,
            SuggestedProfileTweaks = hypotheses.Count > 0
                ? ["Keep the five-minute default unless you change it."]
                : [],
        };
    }

    private static TimeSpan Align(TimeSpan value)
    {
        var minutes = (int)Math.Ceiling(value.TotalMinutes / 5.0) * 5;
        return TimeSpan.FromMinutes(minutes);
    }

    private static string Format(TimeSpan value) =>
        $"{(int)value.TotalHours:00}:{value.Minutes:00}";
}
