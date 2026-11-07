using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Execution;

public class NextAction
{
    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("estimatedMinutes")]
    public int? EstimatedMinutes { get; set; }

    [BsonElement("estimateBasis")]
    public string EstimateBasis { get; set; } = "unknown"; // unknown | user | rough_ai_estimate

    [BsonElement("source")]
    public string Source { get; set; } = "user"; // user | accepted_ai | suggested_ai
}

public class UpcomingStep
{
    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("order")]
    public int Order { get; set; }
}

public class TaskPlanSuggestion
{
    [BsonElement("status")]
    public string Status { get; set; } = "suggestion"; // suggestion | needs_question

    [BsonElement("question")]
    public string? Question { get; set; }

    [BsonElement("nextAction")]
    public NextAction? NextAction { get; set; }

    [BsonElement("upcomingSteps")]
    public List<UpcomingStep> UpcomingSteps { get; set; } = [];

    [BsonElement("definitionOfDone")]
    public string? DefinitionOfDone { get; set; }

    [BsonElement("dependencies")]
    public List<string> Dependencies { get; set; } = [];

    [BsonElement("reason")]
    public string Reason { get; set; } = string.Empty;

    [BsonElement("assumptions")]
    public List<string> Assumptions { get; set; } = [];

    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
