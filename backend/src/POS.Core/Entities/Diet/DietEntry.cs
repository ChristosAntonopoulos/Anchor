using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Diet;

/// <summary>
/// Diet entry - daily diet compliance
/// </summary>
public class DietEntry : DayAnchoredEntity
{
    [BsonElement("compliant")]
    public bool Compliant { get; set; }

    [BsonElement("photoUrl")]
    public string? PhotoUrl { get; set; }

    [BsonElement("note")]
    public string? Note { get; set; }
}
