using POS.Application.DTOs.Tasks;

namespace POS.Application.DTOs.Execution;

public class NextActionDto
{
    public string Text { get; set; } = string.Empty;
    public int? EstimatedMinutes { get; set; }
    public string EstimateBasis { get; set; } = "unknown";
    public string Source { get; set; } = "user";
}

public class UpcomingStepDto
{
    public string Text { get; set; } = string.Empty;
    public int Order { get; set; }
}

public class TaskPlanSuggestionDto
{
    public string Status { get; set; } = "suggestion";
    public string? Question { get; set; }
    public NextActionDto? NextAction { get; set; }
    public List<UpcomingStepDto> UpcomingSteps { get; set; } = [];
    public string? DefinitionOfDone { get; set; }
    public List<string> Dependencies { get; set; } = [];
    public string Reason { get; set; } = string.Empty;
    public List<string> Assumptions { get; set; } = [];
}

public class UnavailablePeriodDto
{
    public string Label { get; set; } = string.Empty;
    public string? Start { get; set; }
    public string? End { get; set; }
}

public class ProfileNoteDto
{
    public string Text { get; set; } = string.Empty;
    public string Kind { get; set; } = "observation";
    public DateTime CreatedAt { get; set; }
}

public class ExecutionProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string PreferredWorkingHoursStart { get; set; } = "09:00";
    public string PreferredWorkingHoursEnd { get; set; } = "18:00";
    public List<UnavailablePeriodDto> TypicalUnavailablePeriods { get; set; } = [];
    public int PreferredInitialSessionMinutes { get; set; } = 5;
    public string PreferredTimerStyle { get; set; } = "countdown";
    public bool BreakReminders { get; set; }
    public bool CountdownsFeelHelpful { get; set; } = true;
    public string AiPromptingLevel { get; set; } = "normal";
    public List<string> CommonWorkContexts { get; set; } = [];
    public List<string> StatedObstacles { get; set; } = [];
    public List<string> StrategiesThatHelp { get; set; } = [];
    public List<string> StrategiesThatDoNotHelp { get; set; } = [];
    public int LastExplicitDurationMinutes { get; set; } = 5;
    public string? Timezone { get; set; }
    public List<ProfileNoteDto> Observations { get; set; } = [];
    public List<ProfileNoteDto> Hypotheses { get; set; } = [];
}

public class UpdateExecutionProfileRequest
{
    public string? PreferredWorkingHoursStart { get; set; }
    public string? PreferredWorkingHoursEnd { get; set; }
    public List<UnavailablePeriodDto>? TypicalUnavailablePeriods { get; set; }
    public int? PreferredInitialSessionMinutes { get; set; }
    public string? PreferredTimerStyle { get; set; }
    public bool? BreakReminders { get; set; }
    public bool? CountdownsFeelHelpful { get; set; }
    public string? AiPromptingLevel { get; set; }
    public List<string>? CommonWorkContexts { get; set; }
    public List<string>? StatedObstacles { get; set; }
    public List<string>? StrategiesThatHelp { get; set; }
    public List<string>? StrategiesThatDoNotHelp { get; set; }
    public string? Timezone { get; set; }
}

public class NowRecommendationDto
{
    public WorkSessionDto? ActiveSession { get; set; }
    public string? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public string NextAction { get; set; } = string.Empty;
    public int SuggestedStartMinutes { get; set; } = 5;
    public string Reason { get; set; } = string.Empty;
    public string? AlternativeTaskId { get; set; }
    public string? AlternativeTitle { get; set; }
    public List<string> ConstraintWarnings { get; set; } = [];
    public string? Question { get; set; }
    public RecoveryCardDto? Recovery { get; set; }
    public bool UsedAi { get; set; }
}

public class RecoveryCardDto
{
    public string BlockId { get; set; } = string.Empty;
    public string? TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = "Plans changed. What fits now?";
    public string NextAction { get; set; } = string.Empty;
    public int SuggestedStartMinutes { get; set; } = 5;
}

public class WorkSessionDto
{
    public string Id { get; set; } = string.Empty;
    public string? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public string? BlockId { get; set; }
    public string Status { get; set; } = "setup";
    public string CurrentAction { get; set; } = string.Empty;
    public int? PlannedMinutes { get; set; }
    public bool TimerEnabled { get; set; }
    public string TimerStyle { get; set; } = "countdown";
    public DateTime? StartedAt { get; set; }
    public long ElapsedMs { get; set; }
    public string? ReturnPoint { get; set; }
    public string? Notes { get; set; }
    public string? FinishOutcome { get; set; }
    public List<string> UpcomingSteps { get; set; } = [];
}

public class StartSessionRequest
{
    public string? TaskId { get; set; }
    public string? BlockId { get; set; }
    public int? Minutes { get; set; }
    public bool? TimerEnabled { get; set; }
    public string? CurrentAction { get; set; }
}

public class FinishSessionRequest
{
    public string? Outcome { get; set; }
    public string? ReturnPoint { get; set; }
    public string? Notes { get; set; }
}

public class DistractionRequest
{
    public string Text { get; set; } = string.Empty;
}

public class StuckRequest
{
    public string? TaskId { get; set; }
    public string? SessionId { get; set; }
    public string? Explanation { get; set; }
    public string? Choice { get; set; }
    public bool MakeSmaller { get; set; }
}

public class StuckResponseDto
{
    public string Approach { get; set; } = string.Empty;
    public string SuggestedAction { get; set; } = string.Empty;
    public int? SuggestedMinutes { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public string? Question { get; set; }
    public string? Alternative { get; set; }
    public bool UsedAi { get; set; }
}

public class AcceptStuckRequest
{
    public string? SessionId { get; set; }
    public string? TaskId { get; set; }
    public string SuggestedAction { get; set; } = string.Empty;
    public int? SuggestedMinutes { get; set; }
}

public class NowRequest
{
    public string? Capacity { get; set; } // 5 | 15 | 30 | unsure
    public bool EasierStart { get; set; }
    public bool Refresh { get; set; }
}

public class RejectNowRequest
{
    public string? TaskId { get; set; }
}

public class DayPlanRequest
{
    public string Scope { get; set; } = "today"; // today | remaining
    public string? Capacity { get; set; }
}

public class ProposedBlockDto
{
    public string? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public string StartLocal { get; set; } = string.Empty;
    public string EndLocal { get; set; } = string.Empty;
    public string Timezone { get; set; } = "UTC";
    public string EntryAction { get; set; } = string.Empty;
    public int StartMinutes { get; set; } = 5;
    public string Reason { get; set; } = string.Empty;
    public bool EstimateUncertain { get; set; }
}

public class DayPlanDto
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = "draft";
    public string Summary { get; set; } = string.Empty;
    public string? FirstTaskId { get; set; }
    public List<ProposedBlockDto> ProposedBlocks { get; set; } = [];
    public List<string> UnscheduledTaskIds { get; set; } = [];
    public List<TaskDto> UnscheduledTasks { get; set; } = [];
    public List<string> DeadlineRisks { get; set; } = [];
    public List<string> Assumptions { get; set; } = [];
    public string? Question { get; set; }
    public bool UsedAi { get; set; }
}

public class ApplyDayPlanRequest
{
    public string DraftId { get; set; } = string.Empty;
    public string Mode { get; set; } = "all"; // all | first | discard
}

public class RecoveryActionRequest
{
    public string Action { get; set; } = string.Empty; // shorter | move | leave | replan
    public string? BlockId { get; set; }
    public string? TaskId { get; set; }
}

public class ReturnPointRequest
{
    public string? SessionId { get; set; }
    public string? TaskId { get; set; }
    public string? Notes { get; set; }
}

public class ReturnPointDto
{
    public string ReturnPoint { get; set; } = string.Empty;
    public string NextAction { get; set; } = string.Empty;
    public string? Question { get; set; }
    public bool UsedAi { get; set; }
}

public class AdaptRoutineRequest
{
    public string? DefinitionId { get; set; }
    public string? BlockId { get; set; }
    public string? Capacity { get; set; }
}

public class AdaptRoutineDto
{
    public string RecommendedVersion { get; set; } = "regular";
    public string Reason { get; set; } = string.Empty;
    public List<string> SuggestedShorterSteps { get; set; } = [];
    public string? Question { get; set; }
    public bool UsedAi { get; set; }
}

public class SetRoutineVersionRequest
{
    public string Version { get; set; } = "regular"; // regular | shorter
}

public class ExecutionReviewDto
{
    public List<string> Observations { get; set; } = [];
    public List<string> Hypotheses { get; set; } = [];
    public List<string> SuggestedProfileTweaks { get; set; } = [];
    public string? Question { get; set; }
    public bool UsedAi { get; set; }
}

public class AcceptTaskPlanRequest
{
    public bool Edit { get; set; }
    public string? NextActionText { get; set; }
    public int? EstimatedMinutes { get; set; }
}
