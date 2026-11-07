using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Execution;

/// <summary>
/// Personal execution preferences. Explicit fields are firm defaults.
/// Observed patterns and AI hypotheses stay separate and tentative.
/// </summary>
[BsonIgnoreExtraElements]
public class ExecutionProfile : EntityBase
{
    [BsonElement("preferredWorkingHoursStart")]
    public string PreferredWorkingHoursStart { get; set; } = "09:00";

    [BsonElement("preferredWorkingHoursEnd")]
    public string PreferredWorkingHoursEnd { get; set; } = "18:00";

    [BsonElement("typicalUnavailablePeriods")]
    public List<UnavailablePeriod> TypicalUnavailablePeriods { get; set; } = [];

    [BsonElement("preferredInitialSessionMinutes")]
    public int PreferredInitialSessionMinutes { get; set; } = 5;

    [BsonElement("preferredTimerStyle")]
    public string PreferredTimerStyle { get; set; } = "countdown"; // countdown | elapsed | none

    [BsonElement("breakReminders")]
    public bool BreakReminders { get; set; }

    [BsonElement("countdownsFeelHelpful")]
    public bool CountdownsFeelHelpful { get; set; } = true;

    [BsonElement("aiPromptingLevel")]
    public string AiPromptingLevel { get; set; } = "normal"; // quieter | normal | more

    [BsonElement("commonWorkContexts")]
    public List<string> CommonWorkContexts { get; set; } = [];

    [BsonElement("statedObstacles")]
    public List<string> StatedObstacles { get; set; } =
    [
        "I can struggle to initiate tasks.",
        "I can sometimes focus for long periods once started.",
    ];

    [BsonElement("strategiesThatHelp")]
    public List<string> StrategiesThatHelp { get; set; } =
    [
        "Concrete next actions.",
        "Reduced decision burden.",
        "Short starts into longer work.",
    ];

    [BsonElement("strategiesThatDoNotHelp")]
    public List<string> StrategiesThatDoNotHelp { get; set; } =
    [
        "Long motivational speeches.",
    ];

    [BsonElement("lastExplicitDurationMinutes")]
    public int LastExplicitDurationMinutes { get; set; } = 5;

    [BsonElement("timezone")]
    public string? Timezone { get; set; }

    [BsonElement("observations")]
    public List<ProfileNote> Observations { get; set; } = [];

    [BsonElement("hypotheses")]
    public List<ProfileNote> Hypotheses { get; set; } = [];
}

public class UnavailablePeriod
{
    [BsonElement("label")]
    public string Label { get; set; } = string.Empty;

    [BsonElement("start")]
    public string? Start { get; set; }

    [BsonElement("end")]
    public string? End { get; set; }
}

public class ProfileNote
{
    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("kind")]
    public string Kind { get; set; } = "observation"; // observation | hypothesis

    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
