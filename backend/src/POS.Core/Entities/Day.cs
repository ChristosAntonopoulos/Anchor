using MongoDB.Bson.Serialization.Attributes;
using POS.Core.Constants;

namespace POS.Core.Entities;

/// <summary>
/// Day entity - anchor for daily instances and bootstrap state.
/// </summary>
public class Day : DayAnchoredEntity
{
    [BsonElement("focusCategory")]
    public string? FocusCategory { get; set; }

    [BsonElement("bootstrapStatus")]
    public string BootstrapStatus { get; set; } = DayBootstrapStatus.Pending;

    [BsonElement("bootstrapStartedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? BootstrapStartedAt { get; set; }

    [BsonElement("bootstrappedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? BootstrappedAt { get; set; }

    [BsonElement("bootstrapError")]
    public string? BootstrapError { get; set; }

    [BsonElement("yesterdayAssessment")]
    public YesterdayAssessment? YesterdayAssessment { get; set; }

    [BsonElement("assessmentSeenAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? AssessmentSeenAt { get; set; }
}
