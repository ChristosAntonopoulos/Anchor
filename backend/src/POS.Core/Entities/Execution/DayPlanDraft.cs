using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Execution;

[BsonIgnoreExtraElements]
public class DayPlanDraft : EntityBase
{
    [BsonElement("date")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc, DateOnly = true)]
    public DateTime Date { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "draft"; // draft | applied | discarded

    [BsonElement("summary")]
    public string Summary { get; set; } = string.Empty;

    [BsonElement("firstTaskId")]
    public string? FirstTaskId { get; set; }

    [BsonElement("proposedBlocks")]
    public List<ProposedBlock> ProposedBlocks { get; set; } = [];

    [BsonElement("unscheduledTaskIds")]
    public List<string> UnscheduledTaskIds { get; set; } = [];

    [BsonElement("deadlineRisks")]
    public List<string> DeadlineRisks { get; set; } = [];

    [BsonElement("assumptions")]
    public List<string> Assumptions { get; set; } = [];

    [BsonElement("question")]
    public string? Question { get; set; }

    [BsonElement("scope")]
    public string Scope { get; set; } = "today"; // today | remaining
}

public class ProposedBlock
{
    [BsonElement("taskId")]
    public string? TaskId { get; set; }

    [BsonElement("startLocal")]
    public string StartLocal { get; set; } = string.Empty;

    [BsonElement("endLocal")]
    public string EndLocal { get; set; } = string.Empty;

    [BsonElement("timezone")]
    public string Timezone { get; set; } = "UTC";

    [BsonElement("entryAction")]
    public string EntryAction { get; set; } = string.Empty;

    [BsonElement("startMinutes")]
    public int StartMinutes { get; set; } = 5;

    [BsonElement("reason")]
    public string Reason { get; set; } = string.Empty;

    [BsonElement("estimateUncertain")]
    public bool EstimateUncertain { get; set; }
}
