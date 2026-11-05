using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Execution;

[BsonIgnoreExtraElements]
public class WorkSession : EntityBase
{
    [BsonElement("taskId")]
    public string? TaskId { get; set; }

    [BsonElement("blockId")]
    public string? BlockId { get; set; }

    [BsonElement("historicalBlockId")]
    public string? HistoricalBlockId { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "setup"; // setup | running | paused | time_check | finished

    [BsonElement("currentAction")]
    public string CurrentAction { get; set; } = string.Empty;

    [BsonElement("plannedMinutes")]
    public int? PlannedMinutes { get; set; }

    [BsonElement("timerEnabled")]
    public bool TimerEnabled { get; set; } = true;

    [BsonElement("timerStyle")]
    public string TimerStyle { get; set; } = "countdown";

    [BsonElement("startedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? StartedAt { get; set; }

    [BsonElement("pausedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PausedAt { get; set; }

    [BsonElement("finishedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? FinishedAt { get; set; }

    [BsonElement("elapsedMs")]
    public long ElapsedMs { get; set; }

    [BsonElement("distractions")]
    public List<SessionNote> Distractions { get; set; } = [];

    [BsonElement("stuckAttempts")]
    public List<StuckAttempt> StuckAttempts { get; set; } = [];

    [BsonElement("finishOutcome")]
    public string? FinishOutcome { get; set; } // progress | finished_task | did_not_start | left

    [BsonElement("returnPoint")]
    public string? ReturnPoint { get; set; }

    [BsonElement("notes")]
    public string? Notes { get; set; }

    [BsonElement("date")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc, DateOnly = true)]
    public DateTime Date { get; set; }
}

public class SessionNote
{
    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class StuckAttempt
{
    [BsonElement("explanation")]
    public string? Explanation { get; set; }

    [BsonElement("choice")]
    public string? Choice { get; set; }

    [BsonElement("approach")]
    public string? Approach { get; set; }

    [BsonElement("suggestedAction")]
    public string? SuggestedAction { get; set; }

    [BsonElement("accepted")]
    public bool? Accepted { get; set; }

    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
