namespace POS.Application.Services.Execution;

public class AiPlanTaskResult
{
    public string Status { get; set; } = "suggestion";
    public string? Question { get; set; }
    public AiNextAction? NextAction { get; set; }
    public List<string> UpcomingSteps { get; set; } = [];
    public string? DefinitionOfDone { get; set; }
    public List<string> Dependencies { get; set; } = [];
    public string Reason { get; set; } = string.Empty;
    public List<string> Assumptions { get; set; } = [];
}

public class AiNextAction
{
    public string Text { get; set; } = string.Empty;
    public int? EstimatedMinutes { get; set; }
    public string EstimateBasis { get; set; } = "unknown";
}

public class AiNowResult
{
    public string? TaskId { get; set; }
    public string NextAction { get; set; } = string.Empty;
    public int SuggestedStartMinutes { get; set; } = 5;
    public string Reason { get; set; } = string.Empty;
    public string? AlternativeTaskId { get; set; }
    public List<string> ConstraintWarnings { get; set; } = [];
    public string? Question { get; set; }
}

public class AiStuckResult
{
    public string Approach { get; set; } = string.Empty;
    public string SuggestedAction { get; set; } = string.Empty;
    public int? SuggestedMinutes { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public string? Question { get; set; }
    public string? Alternative { get; set; }
}

public class AiDayPlanResult
{
    public string Summary { get; set; } = string.Empty;
    public string? FirstTaskId { get; set; }
    public List<AiProposedBlock> ProposedBlocks { get; set; } = [];
    public List<string> UnscheduledTaskIds { get; set; } = [];
    public List<string> DeadlineRisks { get; set; } = [];
    public List<string> Assumptions { get; set; } = [];
    public string? Question { get; set; }
}

public class AiProposedBlock
{
    public string? TaskId { get; set; }
    public string StartLocal { get; set; } = string.Empty;
    public string EndLocal { get; set; } = string.Empty;
    public string Timezone { get; set; } = "UTC";
    public string EntryAction { get; set; } = string.Empty;
    public int StartMinutes { get; set; } = 5;
    public string Reason { get; set; } = string.Empty;
    public bool EstimateUncertain { get; set; }
}

public class AiReturnPointResult
{
    public string ReturnPoint { get; set; } = string.Empty;
    public string NextAction { get; set; } = string.Empty;
    public string? Question { get; set; }
}

public class AiAdaptRoutineResult
{
    public string RecommendedVersion { get; set; } = "regular";
    public string Reason { get; set; } = string.Empty;
    public List<string> SuggestedShorterSteps { get; set; } = [];
    public string? Question { get; set; }
}

public class AiReviewResult
{
    public List<string> Observations { get; set; } = [];
    public List<string> Hypotheses { get; set; } = [];
    public List<string> SuggestedProfileTweaks { get; set; } = [];
    public string? Question { get; set; }
}

public class ExecutionCallResult<T>
{
    public T Value { get; init; } = default!;
    public bool UsedAi { get; init; }
}
