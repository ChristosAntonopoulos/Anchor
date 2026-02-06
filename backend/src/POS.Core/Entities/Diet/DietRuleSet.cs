using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Diet;

/// <summary>
/// Diet rule set - user's diet compliance rules
/// 
/// NOTE: This entity is used by the AI & Scheduling Service for diet compliance rules.
/// It is not used by the Data API and may be empty until the AI service is implemented.
/// </summary>
public class DietRuleSet : EntityBase
{
    [BsonElement("mode")]
    public string Mode { get; set; } = "compliance";

    [BsonElement("notes")]
    public string? Notes { get; set; }
}
