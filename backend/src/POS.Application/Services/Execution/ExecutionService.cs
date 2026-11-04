using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Execution;
using POS.Application.DTOs.Tasks;
using POS.Application.Services.Day;
using POS.Core.Constants;
using POS.Core.Entities.Execution;
using POS.Core.Entities.Schedule;
using POS.Core.Exceptions;
using POS.Core.Schedule;
using POS.Infrastructure.Data;
using TaskEntity = POS.Core.Entities.Tasks.Task;
using TaskStatus = POS.Core.Constants.TaskStatus;

namespace POS.Application.Services.Execution;

public class ExecutionService
{
    private static readonly int[] DurationChoices = [2, 5, 15, 25];
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly UserDayClock _dayClock;
    private readonly ILanguageModelClient _model;
    private readonly ILogger<ExecutionService> _logger;

    public ExecutionService(
        MongoDbContext context,
        IMapper mapper,
        UserDayClock dayClock,
        ILanguageModelClient model,
        ILogger<ExecutionService> logger)
    {
        _context = context;
        _mapper = mapper;
        _dayClock = dayClock;
        _model = model;
        _logger = logger;
    }

    public async Task<ExecutionProfileDto> GetProfileAsync(string userId, CancellationToken ct = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, ct);
        return MapProfile(profile);
    }

    public async Task<ExecutionProfileDto> UpdateProfileAsync(string userId, UpdateExecutionProfileRequest request, CancellationToken ct = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, ct);
        if (request.PreferredWorkingHoursStart != null) profile.PreferredWorkingHoursStart = request.PreferredWorkingHoursStart;
        if (request.PreferredWorkingHoursEnd != null) profile.PreferredWorkingHoursEnd = request.PreferredWorkingHoursEnd;
        if (request.TypicalUnavailablePeriods != null)
        {
            profile.TypicalUnavailablePeriods = request.TypicalUnavailablePeriods
                .Select(p => new UnavailablePeriod { Label = p.Label, Start = p.Start, End = p.End })
                .ToList();
        }
        if (request.PreferredInitialSessionMinutes is int minutes && DurationChoices.Contains(minutes))
        {
            profile.PreferredInitialSessionMinutes = minutes;
            profile.LastExplicitDurationMinutes = minutes;
        }
        if (request.PreferredTimerStyle != null) profile.PreferredTimerStyle = request.PreferredTimerStyle;
        if (request.BreakReminders.HasValue) profile.BreakReminders = request.BreakReminders.Value;
        if (request.CountdownsFeelHelpful.HasValue) profile.CountdownsFeelHelpful = request.CountdownsFeelHelpful.Value;
        if (request.AiPromptingLevel != null) profile.AiPromptingLevel = request.AiPromptingLevel;
        if (request.CommonWorkContexts != null) profile.CommonWorkContexts = request.CommonWorkContexts;
        if (request.StatedObstacles != null) profile.StatedObstacles = request.StatedObstacles;
        if (request.StrategiesThatHelp != null) profile.StrategiesThatHelp = request.StrategiesThatHelp;
        if (request.StrategiesThatDoNotHelp != null) profile.StrategiesThatDoNotHelp = request.StrategiesThatDoNotHelp;
        if (request.Timezone != null) profile.Timezone = request.Timezone;
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.ExecutionProfiles.ReplaceOneAsync(p => p.Id == profile.Id, profile, cancellationToken: ct);
        return MapProfile(profile);
    }

    public async Task<NowRecommendationDto> GetNowAsync(string userId, NowRequest request, CancellationToken ct = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, ct);
        var active = await GetActiveSessionEntityAsync(userId, ct);
        if (active != null && !request.Refresh)
        {
            var mapped = await MapSessionAsync(active, ct);
            return new NowRecommendationDto
            {
                ActiveSession = mapped,
                TaskId = active.TaskId,
                TaskTitle = mapped.TaskTitle,
                NextAction = active.CurrentAction,
                SuggestedStartMinutes = active.PlannedMinutes ?? profile.LastExplicitDurationMinutes,
                Reason = "A session is already open. Continue it, or ask to switch.",
            };
        }

        var (candidates, rejected, windowReason, startMinutes, recovery) = await BuildNowContextAsync(userId, profile, request, ct);
        var heuristic = ExecutionHeuristics.RecommendNow(candidates, rejected, startMinutes, windowReason, request.EasierStart);
        var usedAi = false;
        if (profile.AiPromptingLevel != "quieter")
        {
            var ai = await CallAsync<AiNowResult>(
                ExecutionPrompts.RecommendNow,
                new
                {
                    capacity = request.Capacity,
                    easierStart = request.EasierStart,
                    currentTime = DateTime.UtcNow,
                    windowReason,
                    startMinutes,
                    rejected = rejected.ToList(),
                    activeSessionId = active?.Id,
                    candidates = candidates.Select(t => new
                    {
                        t.Id,
                        t.Title,
                        nextAction = t.NextAction?.Text,
                        t.DueDate,
                        t.Priority,
                        t.EstimatedMinutes,
                        t.Dependencies,
                    }),
                    preferences = ExplicitPreferences(profile),
                },
                ct);
            if (ai != null)
            {
                heuristic = ValidateNow(ai, candidates, rejected, startMinutes, windowReason);
                usedAi = true;
            }
        }

        var task = candidates.FirstOrDefault(t => t.Id == heuristic.TaskId);
        var alt = candidates.FirstOrDefault(t => t.Id == heuristic.AlternativeTaskId);
        return new NowRecommendationDto
        {
            TaskId = task?.Id,
            TaskTitle = task?.Title,
            NextAction = heuristic.NextAction,
            SuggestedStartMinutes = heuristic.SuggestedStartMinutes,
            Reason = heuristic.Reason,
            AlternativeTaskId = alt?.Id,
            AlternativeTitle = alt?.Title,
            ConstraintWarnings = heuristic.ConstraintWarnings,
            Question = heuristic.Question,
            Recovery = recovery,
            UsedAi = usedAi,
        };
    }

    public async System.Threading.Tasks.Task RejectNowAsync(string userId, RejectNowRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.TaskId))
        {
            return;
        }

        var task = await FindTaskAsync(userId, request.TaskId, ct);
        if (task == null)
        {
            return;
        }

        task.RejectedSuggestionKeys ??= [];
        var key = $"now:{DateTime.UtcNow:yyyy-MM-dd}:{task.Id}";
        if (!task.RejectedSuggestionKeys.Contains(key))
        {
            task.RejectedSuggestionKeys.Add(key);
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.Tasks.ReplaceOneAsync(t => t.Id == task.Id, task, cancellationToken: ct);
    }

    public async Task<WorkSessionDto> StartSessionAsync(string userId, StartSessionRequest request, CancellationToken ct = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, ct);
        var today = await _dayClock.GetTodayAsync(userId, ct);
        var existing = await GetActiveSessionEntityAsync(userId, ct);
        if (existing != null)
        {
            return await MapSessionAsync(existing, ct);
        }

        var minutes = request.Minutes ?? profile.LastExplicitDurationMinutes;
        if (request.Minutes.HasValue)
        {
            profile.LastExplicitDurationMinutes = request.Minutes.Value;
            profile.UpdatedAt = DateTime.UtcNow;
            await _context.ExecutionProfiles.ReplaceOneAsync(p => p.Id == profile.Id, profile, cancellationToken: ct);
        }

        TaskEntity? task = null;
        ScheduleBlockInstance? block = null;
        if (!string.IsNullOrWhiteSpace(request.TaskId))
        {
            task = await FindTaskAsync(userId, request.TaskId, ct) ?? throw new NotFoundException("Task", request.TaskId);
        }

        if (!string.IsNullOrWhiteSpace(request.BlockId))
        {
            block = await FindBlockAsync(userId, request.BlockId, ct) ?? throw new NotFoundException("ScheduleBlock", request.BlockId);
            if (task == null && !string.IsNullOrWhiteSpace(block.TaskId))
            {
                task = await FindTaskAsync(userId, block.TaskId, ct);
            }
        }

        var timerEnabled = request.TimerEnabled ?? profile.PreferredTimerStyle != "none";
        var timerStyle = !timerEnabled
            ? "none"
            : profile.CountdownsFeelHelpful
                ? profile.PreferredTimerStyle
                : "elapsed";

        var current = request.CurrentAction
            ?? task?.ReturnPoint
            ?? task?.NextAction?.Text
            ?? block?.EntryAction
            ?? task?.Title
            ?? block?.Title
            ?? "Start the next action.";

        var session = new WorkSession
        {
            UserId = userId,
            TaskId = task?.Id,
            BlockId = block?.Id,
            HistoricalBlockId = block != null && HasEnded(block, await GetTimeZoneAsync(userId, ct)) ? block.Id : null,
            Status = "running",
            CurrentAction = current,
            PlannedMinutes = minutes,
            TimerEnabled = timerEnabled,
            TimerStyle = timerStyle,
            StartedAt = DateTime.UtcNow,
            Date = today,
        };
        await _context.WorkSessions.InsertOneAsync(session, cancellationToken: ct);
        return await MapSessionAsync(session, ct);
    }

    public async Task<WorkSessionDto> PauseSessionAsync(string userId, string sessionId, CancellationToken ct = default)
    {
        var session = await RequireSessionAsync(userId, sessionId, ct);
        if (session.Status == "running")
        {
            Accrue(session);
            session.Status = "paused";
            session.PausedAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;
            await ReplaceSessionAsync(session, ct);
        }

        return await MapSessionAsync(session, ct);
    }

    public async Task<WorkSessionDto> ResumeSessionAsync(string userId, string sessionId, CancellationToken ct = default)
    {
        var session = await RequireSessionAsync(userId, sessionId, ct);
        if (session.Status is "paused" or "time_check" or "setup")
        {
            session.Status = "running";
            session.StartedAt = DateTime.UtcNow;
            session.PausedAt = null;
            session.UpdatedAt = DateTime.UtcNow;
            await ReplaceSessionAsync(session, ct);
        }

        return await MapSessionAsync(session, ct);
    }

    public async Task<WorkSessionDto> TimeCheckAsync(string userId, string sessionId, CancellationToken ct = default)
    {
        var session = await RequireSessionAsync(userId, sessionId, ct);
        Accrue(session);
        session.Status = "time_check";
        session.PausedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;
        await ReplaceSessionAsync(session, ct);
        return await MapSessionAsync(session, ct);
    }

    public async Task<WorkSessionDto> CaptureDistractionAsync(string userId, string sessionId, DistractionRequest request, CancellationToken ct = default)
    {
        var session = await RequireSessionAsync(userId, sessionId, ct);
        if (!string.IsNullOrWhiteSpace(request.Text))
        {
            session.Distractions.Add(new SessionNote { Text = request.Text.Trim() });
            session.UpdatedAt = DateTime.UtcNow;
            await ReplaceSessionAsync(session, ct);
        }

        return await MapSessionAsync(session, ct);
    }

    public async Task<WorkSessionDto> FinishSessionAsync(string userId, string sessionId, FinishSessionRequest request, CancellationToken ct = default)
    {
        var session = await RequireSessionAsync(userId, sessionId, ct);
        Accrue(session);
        session.Status = "finished";
        session.FinishedAt = DateTime.UtcNow;
        session.FinishOutcome = string.IsNullOrWhiteSpace(request.Outcome) ? "left" : request.Outcome;
        session.Notes = request.Notes ?? session.Notes;
        session.ReturnPoint = request.ReturnPoint ?? session.ReturnPoint;
        session.UpdatedAt = DateTime.UtcNow;
        await ReplaceSessionAsync(session, ct);

        if (!string.IsNullOrWhiteSpace(session.TaskId))
        {
            var task = await FindTaskAsync(userId, session.TaskId, ct);
            if (task != null)
            {
                if (!string.IsNullOrWhiteSpace(session.ReturnPoint))
                {
                    task.ReturnPoint = session.ReturnPoint;
                }

                if (!string.IsNullOrWhiteSpace(request.ReturnPoint) && task.NextAction != null)
                {
                    task.NextAction.Text = request.ReturnPoint;
                    task.NextAction.Source = "user";
                }

                if (request.Outcome == "finished_task")
                {
                    task.Completed = true;
                    task.Status = TaskStatus.Done;
                    task.CompletedAt = DateTime.UtcNow;
                    task.FocusRank = null;
                }

                task.UpdatedAt = DateTime.UtcNow;
                await _context.Tasks.ReplaceOneAsync(t => t.Id == task.Id, task, cancellationToken: ct);
            }
        }

        return await MapSessionAsync(session, ct);
    }

    public async Task<WorkSessionDto?> GetActiveSessionAsync(string userId, CancellationToken ct = default)
    {
        var session = await GetActiveSessionEntityAsync(userId, ct);
        return session == null ? null : await MapSessionAsync(session, ct);
    }

    public async Task<TaskDto> PlanTaskAsync(string userId, string taskId, CancellationToken ct = default, bool requested = true)
    {
        var task = await FindTaskAsync(userId, taskId, ct) ?? throw new NotFoundException("Task", taskId);
        var profile = await GetOrCreateProfileAsync(userId, ct);
        var heuristic = ExecutionHeuristics.PlanTask(task);
        var usedAi = false;
        var allowAi = requested || profile.AiPromptingLevel != "quieter";
        if (allowAi && (!ExecutionHeuristics.LooksSimple(task) || !string.IsNullOrWhiteSpace(task.Notes)))
        {
            var ai = await CallAsync<AiPlanTaskResult>(
                ExecutionPrompts.PlanTask,
                new
                {
                    task = new
                    {
                        task.Id,
                        task.Title,
                        task.Notes,
                        existingNextAction = task.NextAction?.Text,
                        existingSteps = task.UpcomingSteps?.Select(s => s.Text),
                        task.DueDate,
                        task.Dependencies,
                        task.EstimatedMinutes,
                    },
                    preferences = ExplicitPreferences(profile),
                },
                ct);
            if (ai?.NextAction != null && !string.IsNullOrWhiteSpace(ai.NextAction.Text))
            {
                heuristic = ai;
                usedAi = true;
            }
        }

        task.PendingSuggestion = new TaskPlanSuggestion
        {
            Status = heuristic.Status,
            Question = heuristic.Question,
            NextAction = new NextAction
            {
                Text = heuristic.NextAction?.Text ?? task.Title,
                EstimatedMinutes = heuristic.NextAction?.EstimatedMinutes,
                EstimateBasis = heuristic.NextAction?.EstimateBasis ?? "rough_ai_estimate",
                Source = "suggested_ai",
            },
            UpcomingSteps = heuristic.UpcomingSteps.Take(3).Select((text, i) => new UpcomingStep { Text = text, Order = i }).ToList(),
            DefinitionOfDone = heuristic.DefinitionOfDone,
            Dependencies = heuristic.Dependencies,
            Reason = usedAi ? heuristic.Reason : heuristic.Reason,
            Assumptions = heuristic.Assumptions,
        };
        task.UpdatedAt = DateTime.UtcNow;
        await _context.Tasks.ReplaceOneAsync(t => t.Id == task.Id, task, cancellationToken: ct);
        return _mapper.Map<TaskDto>(task);
    }

    public async System.Threading.Tasks.Task PlanTaskInBackgroundAsync(string userId, string taskId)
    {
        try
        {
            await PlanTaskAsync(userId, taskId, requested: false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Background task plan failed for {TaskId}", taskId);
        }
    }

    public async Task<TaskDto> AcceptTaskPlanAsync(string userId, string taskId, AcceptTaskPlanRequest request, CancellationToken ct = default)
    {
        var task = await FindTaskAsync(userId, taskId, ct) ?? throw new NotFoundException("Task", taskId);
        var suggestion = task.PendingSuggestion;
        var text = request.NextActionText ?? suggestion?.NextAction?.Text ?? task.Title;
        task.NextAction = new NextAction
        {
            Text = text,
            EstimatedMinutes = request.EstimatedMinutes ?? suggestion?.NextAction?.EstimatedMinutes,
            EstimateBasis = request.Edit ? "user" : suggestion?.NextAction?.EstimateBasis ?? "user",
            Source = request.Edit ? "user" : "accepted_ai",
        };
        if (suggestion != null && !request.Edit)
        {
            task.UpcomingSteps = suggestion.UpcomingSteps;
            task.DefinitionOfDone = suggestion.DefinitionOfDone;
            if (suggestion.Dependencies.Count > 0)
            {
                task.Dependencies = suggestion.Dependencies;
            }
        }

        task.PendingSuggestion = null;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.Tasks.ReplaceOneAsync(t => t.Id == task.Id, task, cancellationToken: ct);
        return _mapper.Map<TaskDto>(task);
    }

    public async Task<StuckResponseDto> HelpStuckAsync(string userId, StuckRequest request, CancellationToken ct = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, ct);
        TaskEntity? task = null;
        WorkSession? session = null;
        if (!string.IsNullOrWhiteSpace(request.SessionId))
        {
            session = await RequireSessionAsync(userId, request.SessionId, ct);
        }

        var taskId = request.TaskId ?? session?.TaskId;
        if (!string.IsNullOrWhiteSpace(taskId))
        {
            task = await FindTaskAsync(userId, taskId, ct);
        }

        var heuristic = ExecutionHeuristics.Stuck(
            task,
            request.Choice,
            request.MakeSmaller,
            task?.StuckAttemptCount ?? session?.StuckAttempts.Count ?? 0,
            task?.LastStuckApproach);

        var usedAi = false;
        var ai = await CallAsync<AiStuckResult>(
            ExecutionPrompts.Stuck,
            new
            {
                task = task == null ? null : new { task.Id, task.Title, nextAction = task.NextAction?.Text, task.StuckAttemptCount, task.LastStuckApproach },
                explanation = request.Explanation,
                choice = request.Choice,
                makeSmaller = request.MakeSmaller,
                availableMinutes = session?.PlannedMinutes ?? profile.LastExplicitDurationMinutes,
                previous = session?.StuckAttempts.Select(s => new { s.Approach, s.SuggestedAction, s.Accepted }),
                preferences = ExplicitPreferences(profile),
            },
            ct);
        if (ai != null && !string.IsNullOrWhiteSpace(ai.SuggestedAction))
        {
            if (task?.LastStuckApproach == "smaller" && (task.StuckAttemptCount >= 2) &&
                (ai.Approach.Contains("smaller", StringComparison.OrdinalIgnoreCase)))
            {
                heuristic = ExecutionHeuristics.Stuck(task, request.Choice, true, task.StuckAttemptCount, "smaller");
            }
            else
            {
                heuristic = ai;
                usedAi = true;
            }
        }

        if (session != null)
        {
            session.StuckAttempts.Add(new StuckAttempt
            {
                Explanation = request.Explanation,
                Choice = request.Choice,
                Approach = heuristic.Approach,
                SuggestedAction = heuristic.SuggestedAction,
            });
            await ReplaceSessionAsync(session, ct);
        }

        if (task != null)
        {
            task.StuckAttemptCount += 1;
            task.LastStuckApproach = heuristic.Approach;
            task.UpdatedAt = DateTime.UtcNow;
            await _context.Tasks.ReplaceOneAsync(t => t.Id == task.Id, task, cancellationToken: ct);
        }

        return new StuckResponseDto
        {
            Approach = heuristic.Approach,
            SuggestedAction = heuristic.SuggestedAction,
            SuggestedMinutes = heuristic.SuggestedMinutes,
            Explanation = heuristic.Explanation,
            Question = heuristic.Question,
            Alternative = heuristic.Alternative,
            UsedAi = usedAi,
        };
    }

    public async Task<TaskDto> AcceptStuckAsync(string userId, AcceptStuckRequest request, CancellationToken ct = default)
    {
        var taskId = request.TaskId;
        if (!string.IsNullOrWhiteSpace(request.SessionId))
        {
            var session = await RequireSessionAsync(userId, request.SessionId, ct);
            session.CurrentAction = request.SuggestedAction;
            var last = session.StuckAttempts.LastOrDefault();
            if (last != null)
            {
                last.Accepted = true;
            }

            await ReplaceSessionAsync(session, ct);
            taskId ??= session.TaskId;
        }

        if (string.IsNullOrWhiteSpace(taskId))
        {
            throw new InvalidOperationException("A task is required to keep the new action.");
        }

        var task = await FindTaskAsync(userId, taskId, ct) ?? throw new NotFoundException("Task", taskId);
        task.NextAction = new NextAction
        {
            Text = request.SuggestedAction,
            EstimatedMinutes = request.SuggestedMinutes,
            EstimateBasis = request.SuggestedMinutes.HasValue ? "rough_ai_estimate" : "unknown",
            Source = "accepted_ai",
        };
        task.UpdatedAt = DateTime.UtcNow;
        await _context.Tasks.ReplaceOneAsync(t => t.Id == task.Id, task, cancellationToken: ct);
        return _mapper.Map<TaskDto>(task);
    }

    public async Task<DayPlanDto> PlanDayAsync(string userId, DayPlanRequest request, CancellationToken ct = default)
    {
        var profile = await GetOrCreateProfileAsync(userId, ct);
        var today = await _dayClock.GetTodayAsync(userId, ct);
        var tz = await GetTimeZoneAsync(userId, ct);
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var tasks = await CandidateTasksAsync(userId, today, ct);
        var blocks = await TodayBlocksAsync(userId, today, ct);
        var windows = FreeWindows(blocks, profile, request.Scope == "remaining" ? localNow.TimeOfDay : TimeSpan.Zero);
        var startMinutes = profile.LastExplicitDurationMinutes;
        var heuristic = ExecutionHeuristics.PlanDay(tasks, windows, tz.Id, startMinutes, localNow);
        var usedAi = false;
        var ai = await CallAsync<AiDayPlanResult>(
            ExecutionPrompts.PlanDay,
            new
            {
                scope = request.Scope,
                timezone = tz.Id,
                localNow = localNow.ToString("HH:mm"),
                date = today.ToString("yyyy-MM-dd"),
                preferredHours = new { profile.PreferredWorkingHoursStart, profile.PreferredWorkingHoursEnd },
                fixedCommitments = blocks.Where(b => b.Locked || IsRoutine(b)).Select(b => new { b.Id, b.Title, b.StartTime, b.EndTime, b.Locked }),
                flexibleBlocks = blocks.Where(b => !b.Locked && !IsRoutine(b)).Select(b => new { b.Id, b.Title, b.StartTime, b.EndTime, b.TaskId }),
                tasks = tasks.Select(t => new
                {
                    t.Id,
                    t.Title,
                    nextAction = t.NextAction?.Text,
                    t.DueDate,
                    t.Priority,
                    t.EstimatedMinutes,
                    t.Dependencies,
                }),
                deadlines = await DeadlineContextAsync(userId, ct),
                preferences = ExplicitPreferences(profile),
            },
            ct);
        if (ai != null)
        {
            var validated = ValidateDayPlan(ai, tasks, blocks, today, tz, request.Scope, localNow);
            if (validated != null)
            {
                heuristic = validated;
                usedAi = true;
            }
            else
            {
                var retry = await CallAsync<AiDayPlanResult>(
                    ExecutionPrompts.PlanDay + "\nThe previous draft was invalid. Preserve fixed commitments, stay inside today, and use only supplied task IDs.",
                    new { previous = ai, validation = "Rejected invalid IDs, overlaps, or times outside the requested period." },
                    ct);
                var second = retry == null ? null : ValidateDayPlan(retry, tasks, blocks, today, tz, request.Scope, localNow);
                if (second != null)
                {
                    heuristic = second;
                    usedAi = true;
                }
            }
        }

        var draft = new DayPlanDraft
        {
            UserId = userId,
            Date = today,
            Status = "draft",
            Summary = heuristic.Summary,
            FirstTaskId = heuristic.FirstTaskId,
            ProposedBlocks = heuristic.ProposedBlocks.Select(MapProposed).ToList(),
            UnscheduledTaskIds = heuristic.UnscheduledTaskIds,
            DeadlineRisks = heuristic.DeadlineRisks,
            Assumptions = heuristic.Assumptions,
            Question = heuristic.Question,
            Scope = request.Scope,
        };
        await _context.DayPlanDrafts.InsertOneAsync(draft, cancellationToken: ct);
        return await MapDraftAsync(draft, tasks, usedAi, ct);
    }

    public async Task<DayPlanDto> ApplyDayPlanAsync(string userId, ApplyDayPlanRequest request, CancellationToken ct = default)
    {
        var draft = await _context.DayPlanDrafts.Find(d => d.Id == request.DraftId && d.UserId == userId).FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("DayPlanDraft", request.DraftId);
        if (request.Mode == "discard")
        {
            draft.Status = "discarded";
            draft.UpdatedAt = DateTime.UtcNow;
            await _context.DayPlanDrafts.ReplaceOneAsync(d => d.Id == draft.Id, draft, cancellationToken: ct);
            return await MapDraftAsync(draft, [], false, ct);
        }

        var today = await _dayClock.GetTodayAsync(userId, ct);
        var apply = request.Mode == "first"
            ? draft.ProposedBlocks.Take(1).ToList()
            : draft.ProposedBlocks;
        foreach (var proposed in apply)
        {
            if (string.IsNullOrWhiteSpace(proposed.TaskId) || !TryParseTime(proposed.StartLocal, out _) || !TryParseTime(proposed.EndLocal, out _))
            {
                continue;
            }

            var block = new ScheduleBlockInstance
            {
                UserId = userId,
                Date = today,
                Title = "Work block",
                StartTime = proposed.StartLocal,
                EndTime = proposed.EndLocal,
                Locked = false,
                Source = "ai",
                TaskId = proposed.TaskId,
                EntryAction = proposed.EntryAction,
                StartMinutes = proposed.StartMinutes,
                WindowKind = "flexible",
            };
            var task = await FindTaskAsync(userId, proposed.TaskId, ct);
            if (task != null)
            {
                block.Title = task.Title;
                if (task.Status != TaskStatus.Today && !task.Completed)
                {
                    task.Status = TaskStatus.Today;
                    task.PlannedDate = today;
                    task.UpdatedAt = DateTime.UtcNow;
                    await _context.Tasks.ReplaceOneAsync(t => t.Id == task.Id, task, cancellationToken: ct);
                }
            }

            await _context.ScheduleBlockInstances.InsertOneAsync(block, cancellationToken: ct);
        }

        draft.Status = "applied";
        draft.UpdatedAt = DateTime.UtcNow;
        await _context.DayPlanDrafts.ReplaceOneAsync(d => d.Id == draft.Id, draft, cancellationToken: ct);
        var tasks = await CandidateTasksAsync(userId, today, ct);
        return await MapDraftAsync(draft, tasks, true, ct);
    }

    public async Task<NowRecommendationDto> RecoveryActionAsync(string userId, RecoveryActionRequest request, CancellationToken ct = default)
    {
        if (request.Action == "replan")
        {
            await PlanDayAsync(userId, new DayPlanRequest { Scope = "remaining" }, ct);
            return await GetNowAsync(userId, new NowRequest { Refresh = true }, ct);
        }

        if (request.Action == "leave" && !string.IsNullOrWhiteSpace(request.BlockId))
        {
            var block = await FindBlockAsync(userId, request.BlockId, ct);
            if (block != null && !block.Locked)
            {
                block.Skipped = true;
                block.UpdatedAt = DateTime.UtcNow;
                await _context.ScheduleBlockInstances.ReplaceOneAsync(b => b.Id == block.Id, block, cancellationToken: ct);
            }
        }

        if (request.Action == "move" && !string.IsNullOrWhiteSpace(request.BlockId))
        {
            var block = await FindBlockAsync(userId, request.BlockId, ct);
            if (block != null && !block.Locked)
            {
                var tz = await GetTimeZoneAsync(userId, ct);
                var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).TimeOfDay.Add(TimeSpan.FromMinutes(15));
                var duration = Duration(block.StartTime, block.EndTime);
                block.StartTime = Format(local);
                block.EndTime = Format(local.Add(duration));
                block.UpdatedAt = DateTime.UtcNow;
                await _context.ScheduleBlockInstances.ReplaceOneAsync(b => b.Id == block.Id, block, cancellationToken: ct);
            }
        }

        return await GetNowAsync(userId, new NowRequest { Capacity = request.Action == "shorter" ? "5" : null, Refresh = true }, ct);
    }

    public async Task<ReturnPointDto> DraftReturnPointAsync(string userId, ReturnPointRequest request, CancellationToken ct = default)
    {
        WorkSession? session = null;
        if (!string.IsNullOrWhiteSpace(request.SessionId))
        {
            session = await RequireSessionAsync(userId, request.SessionId, ct);
        }

        var taskId = request.TaskId ?? session?.TaskId;
        var task = string.IsNullOrWhiteSpace(taskId) ? null : await FindTaskAsync(userId, taskId, ct);
        var heuristic = ExecutionHeuristics.ReturnPoint(task, session);
        var usedAi = false;
        var ai = await CallAsync<AiReturnPointResult>(
            ExecutionPrompts.ReturnPoint,
            new
            {
                task = task == null ? null : new { task.Title, nextAction = task.NextAction?.Text, task.Notes, completedSteps = task.UpcomingSteps },
                session = session == null ? null : new { session.CurrentAction, session.Notes, session.FinishOutcome, session.Distractions },
                notes = request.Notes,
            },
            ct);
        if (ai != null && !string.IsNullOrWhiteSpace(ai.ReturnPoint))
        {
            heuristic = ai;
            usedAi = true;
        }

        if (session != null)
        {
            session.ReturnPoint = heuristic.ReturnPoint;
            await ReplaceSessionAsync(session, ct);
        }

        return new ReturnPointDto
        {
            ReturnPoint = heuristic.ReturnPoint,
            NextAction = heuristic.NextAction,
            Question = heuristic.Question,
            UsedAi = usedAi,
        };
    }

    public async Task<AdaptRoutineDto> AdaptRoutineAsync(string userId, AdaptRoutineRequest request, CancellationToken ct = default)
    {
        var (regular, shorter, _) = await RoutineStepsAsync(userId, request.DefinitionId, request.BlockId, ct);
        var heuristic = ExecutionHeuristics.AdaptRoutine(regular, shorter, request.Capacity);
        var usedAi = false;
        var ai = await CallAsync<AiAdaptRoutineResult>(
            ExecutionPrompts.AdaptRoutine,
            new { regular, shorter, request.Capacity },
            ct);
        if (ai != null && !string.IsNullOrWhiteSpace(ai.RecommendedVersion))
        {
            heuristic = ai;
            usedAi = true;
        }

        return new AdaptRoutineDto
        {
            RecommendedVersion = heuristic.RecommendedVersion,
            Reason = heuristic.Reason,
            SuggestedShorterSteps = heuristic.SuggestedShorterSteps,
            Question = heuristic.Question,
            UsedAi = usedAi,
        };
    }

    public async Task<ScheduleBlockInstance> SetRoutineVersionAsync(string userId, string blockId, string version, CancellationToken ct = default)
    {
        var block = await FindBlockAsync(userId, blockId, ct) ?? throw new NotFoundException("ScheduleBlock", blockId);
        var (regular, shorter, definition) = await RoutineStepsAsync(userId, block.DefinitionId, block.Id, ct);
        var chosen = version == "shorter" ? shorter : regular;
        if (chosen.Count == 0)
        {
            chosen = regular;
            version = "regular";
        }

        block.RoutineVersion = version;
        block.Skipped = false;
        block.RoutineActivities = chosen;
        block.ChecklistItems = chosen.Select((title, index) => new ScheduleChecklistItem
        {
            Title = title,
            DurationMinutes = 5,
            Completed = false,
            Order = index,
        }).ToList();
        block.ChecklistVersion = ScheduleChecklistBuilder.CurrentChecklistVersion;
        block.UpdatedAt = DateTime.UtcNow;
        await _context.ScheduleBlockInstances.ReplaceOneAsync(b => b.Id == block.Id, block, cancellationToken: ct);
        if (definition != null && version == "shorter" && (definition.ShorterRoutineActivities == null || definition.ShorterRoutineActivities.Count == 0))
        {
            definition.ShorterRoutineActivities = shorter;
            definition.UpdatedAt = DateTime.UtcNow;
            await _context.ScheduleBlockDefinitions.ReplaceOneAsync(d => d.Id == definition.Id, definition, cancellationToken: ct);
        }

        return block;
    }

    public async Task<ScheduleBlockInstance> SkipRoutineAsync(string userId, string blockId, CancellationToken ct = default)
    {
        var block = await FindBlockAsync(userId, blockId, ct) ?? throw new NotFoundException("ScheduleBlock", blockId);
        block.Skipped = true;
        block.UpdatedAt = DateTime.UtcNow;
        await _context.ScheduleBlockInstances.ReplaceOneAsync(b => b.Id == block.Id, block, cancellationToken: ct);
        return block;
    }

    public async Task<ExecutionReviewDto> ReviewAsync(string userId, CancellationToken ct = default)
    {
        var today = await _dayClock.GetTodayAsync(userId, ct);
        var from = today.AddDays(-7);
        var sessions = await _context.WorkSessions.Find(s => s.UserId == userId && s.Date >= from).ToListAsync(ct);
        var blocks = await _context.ScheduleBlockInstances.Find(b => b.UserId == userId && b.Date >= from).ToListAsync(ct);
        var finished = sessions.Count(s => s.Status == "finished");
        var missed = blocks.Count(b => !b.Locked && !IsRoutine(b) && sessions.All(s => s.BlockId != b.Id));
        var stuck = sessions.Sum(s => s.StuckAttempts.Count);
        var heuristic = ExecutionHeuristics.Review(missed, finished, stuck);
        var usedAi = false;
        var ai = await CallAsync<AiReviewResult>(
            ExecutionPrompts.ReviewPatterns,
            new
            {
                finished,
                missed,
                stuck,
                outcomes = sessions.Select(s => s.FinishOutcome),
            },
            ct);
        if (ai != null)
        {
            heuristic = ai;
            usedAi = true;
        }

        var profile = await GetOrCreateProfileAsync(userId, ct);
        profile.Observations = heuristic.Observations.Select(text => new ProfileNote { Text = text, Kind = "observation" }).ToList();
        profile.Hypotheses = heuristic.Hypotheses.Select(text => new ProfileNote { Text = text, Kind = "hypothesis" }).ToList();
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.ExecutionProfiles.ReplaceOneAsync(p => p.Id == profile.Id, profile, cancellationToken: ct);

        return new ExecutionReviewDto
        {
            Observations = heuristic.Observations,
            Hypotheses = heuristic.Hypotheses,
            SuggestedProfileTweaks = heuristic.SuggestedProfileTweaks,
            Question = heuristic.Question,
            UsedAi = usedAi,
        };
    }

    private async Task<T?> CallAsync<T>(string capability, object context, CancellationToken ct) where T : class
    {
        if (!_model.IsConfigured)
        {
            return null;
        }

        var json = await _model.CompleteJsonAsync(ExecutionPrompts.System, capability, ExecutionJson.Context(context), ct);
        return ExecutionJson.Parse<T>(json);
    }

    private async Task<ExecutionProfile> GetOrCreateProfileAsync(string userId, CancellationToken ct)
    {
        var existing = await _context.ExecutionProfiles.Find(p => p.UserId == userId).FirstOrDefaultAsync(ct);
        if (existing != null)
        {
            return existing;
        }

        var user = await _context.Users.Find(u => u.UserId == userId).FirstOrDefaultAsync(ct);
        var profile = new ExecutionProfile
        {
            UserId = userId,
            Timezone = string.IsNullOrWhiteSpace(user?.Timezone) ? "Europe/Athens" : user.Timezone,
        };
        await _context.ExecutionProfiles.InsertOneAsync(profile, cancellationToken: ct);
        return profile;
    }

    private async Task<List<TaskEntity>> CandidateTasksAsync(string userId, DateTime today, CancellationToken ct)
    {
        var filter = Builders<TaskEntity>.Filter.And(
            Builders<TaskEntity>.Filter.Eq(t => t.UserId, userId),
            Builders<TaskEntity>.Filter.Eq(t => t.Completed, false),
            Builders<TaskEntity>.Filter.Ne(t => t.Status, TaskStatus.Archived),
            Builders<TaskEntity>.Filter.Ne(t => t.Status, TaskStatus.Done));
        var tasks = await _context.Tasks.Find(filter).ToListAsync(ct);
        return tasks
            .OrderBy(t => t.Status == TaskStatus.Today ? 0 : 1)
            .ThenBy(t => t.DueDate ?? DateTime.MaxValue)
            .ThenBy(t => t.FocusRank ?? 99)
            .ToList();
    }

    private async Task<(List<TaskEntity> Candidates, HashSet<string> Rejected, string Reason, int Minutes, RecoveryCardDto? Recovery)>
        BuildNowContextAsync(string userId, ExecutionProfile profile, NowRequest request, CancellationToken ct)
    {
        var today = await _dayClock.GetTodayAsync(userId, ct);
        var tz = await GetTimeZoneAsync(userId, ct);
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var candidates = await CandidateTasksAsync(userId, today, ct);
        var rejected = candidates
            .SelectMany(t => t.RejectedSuggestionKeys ?? [])
            .Where(k => k.StartsWith($"now:{today:yyyy-MM-dd}:", StringComparison.Ordinal))
            .Select(k => k.Split(':').Last())
            .ToHashSet();
        var blocks = await TodayBlocksAsync(userId, today, ct);
        var current = blocks.FirstOrDefault(b => InWindow(b, local.TimeOfDay));
        var next = blocks.FirstOrDefault(b => ParseTime(b.StartTime) > local.TimeOfDay);
        var remaining = next == null
            ? TimeSpan.FromMinutes(60)
            : ParseTime(next.StartTime) - local.TimeOfDay;
        var capacity = request.Capacity switch
        {
            "5" => 5,
            "15" => 15,
            "30" => 30,
            _ => Math.Min(profile.LastExplicitDurationMinutes, Math.Max(5, (int)remaining.TotalMinutes)),
        };
        if (remaining.TotalMinutes < 8 && request.Capacity is null or "unsure")
        {
            capacity = 5;
        }

        var reason = current != null
            ? $"Fits this {current.Title} window."
            : next != null
                ? $"Fits the {Math.Max(1, (int)remaining.TotalMinutes)}-minute window before {next.Title}."
                : "This is an open stretch of the day.";
        var recovery = BuildRecovery(blocks, candidates, local.TimeOfDay);
        return (candidates, rejected, reason, capacity, recovery);
    }

    private RecoveryCardDto? BuildRecovery(IReadOnlyList<ScheduleBlockInstance> blocks, IReadOnlyList<TaskEntity> tasks, TimeSpan now)
    {
        var missed = blocks.FirstOrDefault(b =>
            !b.Locked &&
            !b.Skipped &&
            !IsRoutine(b) &&
            ParseTime(b.EndTime) < now &&
            ParseTime(b.EndTime) > now.Subtract(TimeSpan.FromHours(3)));
        if (missed == null)
        {
            return null;
        }

        var task = tasks.FirstOrDefault(t => t.Id == missed.TaskId) ?? tasks.FirstOrDefault();
        return new RecoveryCardDto
        {
            BlockId = missed.Id,
            TaskId = task?.Id,
            Title = task?.Title ?? missed.Title,
            NextAction = task?.NextAction?.Text ?? missed.EntryAction ?? task?.Title ?? missed.Title,
            SuggestedStartMinutes = 5,
        };
    }

    private async Task<List<ScheduleBlockInstance>> TodayBlocksAsync(string userId, DateTime today, CancellationToken ct)
    {
        return await _context.ScheduleBlockInstances.Find(b => b.UserId == userId && b.Date == today)
            .SortBy(b => b.StartTime)
            .ToListAsync(ct);
    }

    private static List<(TimeSpan Start, TimeSpan End)> FreeWindows(
        IReadOnlyList<ScheduleBlockInstance> blocks,
        ExecutionProfile profile,
        TimeSpan notBefore)
    {
        var start = Max(ParseTime(profile.PreferredWorkingHoursStart), notBefore);
        var end = ParseTime(profile.PreferredWorkingHoursEnd);
        if (end <= start)
        {
            end = start.Add(TimeSpan.FromHours(8));
        }

        var busy = blocks
            .Where(b => b.Locked || IsRoutine(b))
            .Select(b => (Start: ParseTime(b.StartTime), End: ParseTime(b.EndTime)))
            .OrderBy(x => x.Start)
            .ToList();
        var windows = new List<(TimeSpan, TimeSpan)>();
        var cursor = start;
        foreach (var slot in busy)
        {
            if (slot.Start > cursor)
            {
                windows.Add((cursor, slot.Start));
            }

            if (slot.End > cursor)
            {
                cursor = slot.End;
            }
        }

        if (end > cursor)
        {
            windows.Add((cursor, end));
        }

        return windows.Where(w => (w.Item2 - w.Item1).TotalMinutes >= 15).ToList();
    }

    private AiNowResult ValidateNow(AiNowResult ai, IReadOnlyList<TaskEntity> candidates, IReadOnlySet<string> rejected, int startMinutes, string windowReason)
    {
        var ids = candidates.Select(t => t.Id).ToHashSet();
        if (ai.TaskId != null && (!ids.Contains(ai.TaskId) || rejected.Contains(ai.TaskId)))
        {
            ai.TaskId = null;
        }

        if (ai.AlternativeTaskId != null && !ids.Contains(ai.AlternativeTaskId))
        {
            ai.AlternativeTaskId = null;
        }

        if (ai.SuggestedStartMinutes is < 2 or > 90)
        {
            ai.SuggestedStartMinutes = startMinutes;
        }

        if (string.IsNullOrWhiteSpace(ai.NextAction) || ai.TaskId == null)
        {
            return ExecutionHeuristics.RecommendNow(candidates, rejected, startMinutes, windowReason, false);
        }

        return ai;
    }

    private AiDayPlanResult? ValidateDayPlan(
        AiDayPlanResult plan,
        IReadOnlyList<TaskEntity> tasks,
        IReadOnlyList<ScheduleBlockInstance> blocks,
        DateTime today,
        TimeZoneInfo tz,
        string scope,
        DateTime localNow)
    {
        var ids = tasks.Select(t => t.Id).ToHashSet();
        var validBlocks = new List<AiProposedBlock>();
        foreach (var block in plan.ProposedBlocks)
        {
            if (block.TaskId == null || !ids.Contains(block.TaskId))
            {
                continue;
            }

            if (!TryParseTime(block.StartLocal, out var start) || !TryParseTime(block.EndLocal, out var end) || end <= start)
            {
                continue;
            }

            if (scope == "remaining" && end <= localNow.TimeOfDay)
            {
                continue;
            }

            if (OverlapsFixed(blocks, start, end))
            {
                continue;
            }

            if (validBlocks.Any(existing =>
                    TryParseTime(existing.StartLocal, out var a) &&
                    TryParseTime(existing.EndLocal, out var b) &&
                    start < b && end > a))
            {
                continue;
            }

            block.Timezone = tz.Id;
            if (block.StartMinutes is < 2 or > 90)
            {
                block.StartMinutes = 5;
            }

            validBlocks.Add(block);
        }

        if (plan.FirstTaskId != null && !ids.Contains(plan.FirstTaskId))
        {
            plan.FirstTaskId = validBlocks.FirstOrDefault()?.TaskId;
        }

        plan.ProposedBlocks = validBlocks.Take(4).ToList();
        plan.UnscheduledTaskIds = plan.UnscheduledTaskIds.Where(ids.Contains).ToList();
        return plan.ProposedBlocks.Count == 0 && string.IsNullOrWhiteSpace(plan.Summary) ? null : plan;
    }

    private static bool OverlapsFixed(IEnumerable<ScheduleBlockInstance> blocks, TimeSpan start, TimeSpan end)
    {
        return blocks.Any(b =>
            (b.Locked || IsRoutine(b)) &&
            ParseTime(b.StartTime) < end &&
            ParseTime(b.EndTime) > start);
    }

    private async Task<object> DeadlineContextAsync(string userId, CancellationToken ct)
    {
        var deadlines = await _context.Deadlines.Find(d => d.UserId == userId).ToListAsync(ct);
        return deadlines.Select(d => new { d.Id, d.Title, d.DueDate, d.Status }).ToList();
    }

    private async Task<(List<string> Regular, List<string> Shorter, ScheduleBlockDefinition? Definition)> RoutineStepsAsync(
        string userId,
        string? definitionId,
        string? blockId,
        CancellationToken ct)
    {
        ScheduleBlockDefinition? definition = null;
        if (!string.IsNullOrWhiteSpace(definitionId))
        {
            definition = await _context.ScheduleBlockDefinitions.Find(d => d.Id == definitionId && d.UserId == userId).FirstOrDefaultAsync(ct);
        }

        ScheduleBlockInstance? block = null;
        if (!string.IsNullOrWhiteSpace(blockId))
        {
            block = await FindBlockAsync(userId, blockId, ct);
            if (definition == null && block != null)
            {
                definition = await _context.ScheduleBlockDefinitions.Find(d => d.Id == block.DefinitionId).FirstOrDefaultAsync(ct);
            }
        }

        var regular = definition?.RoutineActivities ?? block?.RoutineActivities ?? [];
        var shorter = definition?.ShorterRoutineActivities ?? DefaultShorter(regular);
        if (definition != null && (definition.ShorterRoutineActivities == null || definition.ShorterRoutineActivities.Count == 0) && shorter.Count > 0)
        {
            definition.ShorterRoutineActivities = shorter;
            await _context.ScheduleBlockDefinitions.ReplaceOneAsync(d => d.Id == definition.Id, definition, cancellationToken: ct);
        }

        return (regular.ToList(), shorter.ToList(), definition);
    }

    private static List<string> DefaultShorter(IReadOnlyList<string> regular)
    {
        if (regular.Count == 0)
        {
            return [];
        }

        if (regular.Any(a => a.Contains("brush", StringComparison.OrdinalIgnoreCase)))
        {
            var brush = regular.First(a => a.Contains("brush", StringComparison.OrdinalIgnoreCase));
            var last = regular.Last();
            return brush == last ? [brush] : [brush, last];
        }

        return regular.Count <= 2 ? regular.ToList() : [regular[0], regular[^1]];
    }

    private async Task<WorkSessionDto> MapSessionAsync(WorkSession session, CancellationToken ct)
    {
        string? title = null;
        var steps = new List<string>();
        if (!string.IsNullOrWhiteSpace(session.TaskId))
        {
            var task = await FindTaskAsync(session.UserId, session.TaskId, ct);
            title = task?.Title;
            steps = task?.UpcomingSteps?.Select(s => s.Text).ToList() ?? [];
        }

        return new WorkSessionDto
        {
            Id = session.Id,
            TaskId = session.TaskId,
            TaskTitle = title,
            BlockId = session.BlockId,
            Status = session.Status,
            CurrentAction = session.CurrentAction,
            PlannedMinutes = session.PlannedMinutes,
            TimerEnabled = session.TimerEnabled,
            TimerStyle = session.TimerStyle,
            StartedAt = session.StartedAt,
            ElapsedMs = session.ElapsedMs,
            ReturnPoint = session.ReturnPoint,
            Notes = session.Notes,
            FinishOutcome = session.FinishOutcome,
            UpcomingSteps = steps,
        };
    }

    private async Task<DayPlanDto> MapDraftAsync(DayPlanDraft draft, IReadOnlyList<TaskEntity> tasks, bool usedAi, CancellationToken ct)
    {
        var byId = tasks.ToDictionary(t => t.Id);
        if (byId.Count == 0 && draft.ProposedBlocks.Count > 0)
        {
            var today = await _dayClock.GetTodayAsync(draft.UserId, ct);
            var loaded = await CandidateTasksAsync(draft.UserId, today, ct);
            byId = loaded.ToDictionary(t => t.Id);
        }

        return new DayPlanDto
        {
            Id = draft.Id,
            Status = draft.Status,
            Summary = draft.Summary,
            FirstTaskId = draft.FirstTaskId,
            ProposedBlocks = draft.ProposedBlocks.Select(b => new ProposedBlockDto
            {
                TaskId = b.TaskId,
                TaskTitle = b.TaskId != null && byId.TryGetValue(b.TaskId, out var task) ? task.Title : null,
                StartLocal = b.StartLocal,
                EndLocal = b.EndLocal,
                Timezone = b.Timezone,
                EntryAction = b.EntryAction,
                StartMinutes = b.StartMinutes,
                Reason = b.Reason,
                EstimateUncertain = b.EstimateUncertain,
            }).ToList(),
            UnscheduledTaskIds = draft.UnscheduledTaskIds,
            UnscheduledTasks = draft.UnscheduledTaskIds
                .Where(byId.ContainsKey)
                .Select(id => _mapper.Map<TaskDto>(byId[id]))
                .ToList(),
            DeadlineRisks = draft.DeadlineRisks,
            Assumptions = draft.Assumptions,
            Question = draft.Question,
            UsedAi = usedAi,
        };
    }

    private static ProposedBlock MapProposed(AiProposedBlock block) => new()
    {
        TaskId = block.TaskId,
        StartLocal = block.StartLocal,
        EndLocal = block.EndLocal,
        Timezone = block.Timezone,
        EntryAction = block.EntryAction,
        StartMinutes = block.StartMinutes,
        Reason = block.Reason,
        EstimateUncertain = block.EstimateUncertain,
    };

    private static ExecutionProfileDto MapProfile(ExecutionProfile profile) => new()
    {
        Id = profile.Id,
        PreferredWorkingHoursStart = profile.PreferredWorkingHoursStart,
        PreferredWorkingHoursEnd = profile.PreferredWorkingHoursEnd,
        TypicalUnavailablePeriods = profile.TypicalUnavailablePeriods
            .Select(p => new UnavailablePeriodDto { Label = p.Label, Start = p.Start, End = p.End })
            .ToList(),
        PreferredInitialSessionMinutes = profile.PreferredInitialSessionMinutes,
        PreferredTimerStyle = profile.PreferredTimerStyle,
        BreakReminders = profile.BreakReminders,
        CountdownsFeelHelpful = profile.CountdownsFeelHelpful,
        AiPromptingLevel = profile.AiPromptingLevel,
        CommonWorkContexts = profile.CommonWorkContexts,
        StatedObstacles = profile.StatedObstacles,
        StrategiesThatHelp = profile.StrategiesThatHelp,
        StrategiesThatDoNotHelp = profile.StrategiesThatDoNotHelp,
        LastExplicitDurationMinutes = profile.LastExplicitDurationMinutes,
        Timezone = profile.Timezone,
        Observations = profile.Observations.Select(n => new ProfileNoteDto { Text = n.Text, Kind = n.Kind, CreatedAt = n.CreatedAt }).ToList(),
        Hypotheses = profile.Hypotheses.Select(n => new ProfileNoteDto { Text = n.Text, Kind = n.Kind, CreatedAt = n.CreatedAt }).ToList(),
    };

    private static object ExplicitPreferences(ExecutionProfile profile) => new
    {
        profile.PreferredWorkingHoursStart,
        profile.PreferredWorkingHoursEnd,
        profile.PreferredInitialSessionMinutes,
        profile.PreferredTimerStyle,
        profile.CountdownsFeelHelpful,
        profile.AiPromptingLevel,
        profile.CommonWorkContexts,
        profile.StatedObstacles,
        profile.StrategiesThatHelp,
        profile.StrategiesThatDoNotHelp,
        note = "These are explicit preferences. Observations and hypotheses are not defaults.",
    };

    private async Task<WorkSession?> GetActiveSessionEntityAsync(string userId, CancellationToken ct)
    {
        var filter = Builders<WorkSession>.Filter.And(
            Builders<WorkSession>.Filter.Eq(s => s.UserId, userId),
            Builders<WorkSession>.Filter.In(s => s.Status, ["setup", "running", "paused", "time_check"]));
        return await _context.WorkSessions.Find(filter).SortByDescending(s => s.CreatedAt).FirstOrDefaultAsync(ct);
    }

    private async Task<WorkSession> RequireSessionAsync(string userId, string sessionId, CancellationToken ct)
    {
        return await _context.WorkSessions.Find(s => s.Id == sessionId && s.UserId == userId).FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("WorkSession", sessionId);
    }

    private Task ReplaceSessionAsync(WorkSession session, CancellationToken ct) =>
        _context.WorkSessions.ReplaceOneAsync(s => s.Id == session.Id, session, cancellationToken: ct);

    private Task<TaskEntity?> FindTaskAsync(string userId, string id, CancellationToken ct) =>
        _context.Tasks.Find(t => t.Id == id && t.UserId == userId).FirstOrDefaultAsync(ct)!;

    private Task<ScheduleBlockInstance?> FindBlockAsync(string userId, string id, CancellationToken ct) =>
        _context.ScheduleBlockInstances.Find(b => b.Id == id && b.UserId == userId).FirstOrDefaultAsync(ct)!;

    private async Task<TimeZoneInfo> GetTimeZoneAsync(string userId, CancellationToken ct)
    {
        var profile = await _context.ExecutionProfiles.Find(p => p.UserId == userId).FirstOrDefaultAsync(ct);
        var user = await _context.Users.Find(u => u.UserId == userId).FirstOrDefaultAsync(ct);
        var id = profile?.Timezone ?? user?.Timezone ?? "Europe/Athens";
        return TimeZoneInfo.TryFindSystemTimeZoneById(id, out var tz) ? tz : TimeZoneInfo.Utc;
    }

    private static void Accrue(WorkSession session)
    {
        if (session.Status == "running" && session.StartedAt.HasValue)
        {
            session.ElapsedMs += (long)(DateTime.UtcNow - session.StartedAt.Value).TotalMilliseconds;
            session.StartedAt = DateTime.UtcNow;
        }
    }

    private static bool IsRoutine(ScheduleBlockInstance block) =>
        (block.RoutineActivities?.Count ?? 0) > 0 ||
        (block.ChecklistItems?.Count ?? 0) > 0 && block.Title.Contains("routine", StringComparison.OrdinalIgnoreCase);

    private static bool HasEnded(ScheduleBlockInstance block, TimeZoneInfo tz)
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).TimeOfDay;
        return ParseTime(block.EndTime) < local;
    }

    private static bool InWindow(ScheduleBlockInstance block, TimeSpan now) =>
        ParseTime(block.StartTime) <= now && now < ParseTime(block.EndTime);

    private static TimeSpan Duration(string start, string end)
    {
        var value = ParseTime(end) - ParseTime(start);
        return value > TimeSpan.Zero ? value : TimeSpan.FromMinutes(30);
    }

    private static TimeSpan ParseTime(string value) =>
        TryParseTime(value, out var time) ? time : TimeSpan.Zero;

    private static bool TryParseTime(string value, out TimeSpan time)
    {
        if (TimeSpan.TryParse(value, out time))
        {
            return true;
        }

        if (DateTime.TryParse(value, out var date))
        {
            time = date.TimeOfDay;
            return true;
        }

        time = default;
        return false;
    }

    private static string Format(TimeSpan value)
    {
        if (value < TimeSpan.Zero)
        {
            value = TimeSpan.Zero;
        }

        return $"{(int)value.TotalHours:00}:{value.Minutes:00}";
    }

    private static TimeSpan Max(TimeSpan a, TimeSpan b) => a > b ? a : b;
}
