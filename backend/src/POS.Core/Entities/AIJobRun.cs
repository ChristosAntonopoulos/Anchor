using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// AI Job Run - audit log for all AI job executions
/// </summary>
public class AIJobRun : EntityBase
{
    [BsonElement("jobType")]
    public string JobType { get; set; } = string.Empty;

    [BsonElement("forDate")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ForDate { get; set; }

    [BsonElement("startedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime StartedAt { get; set; }

    [BsonElement("finishedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? FinishedAt { get; set; }

    [BsonElement("status")]
    public JobStatus Status { get; set; }

    [BsonElement("model")]
    public string Model { get; set; } = string.Empty;

    [BsonElement("promptVersion")]
    public string PromptVersion { get; set; } = string.Empty;

    [BsonElement("inputSummary")]
    public Dictionary<string, object> InputSummary { get; set; } = new();

    [BsonElement("output")]
    public Dictionary<string, object> Output { get; set; } = new();

    [BsonElement("error")]
    public string? Error { get; set; }
}

/// <summary>
/// Status of an AI job run
/// </summary>
public enum JobStatus
{
    Pending,
    Running,
    Success,
    Failed
}
