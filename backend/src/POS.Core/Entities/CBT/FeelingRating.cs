using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.CBT;

[BsonIgnoreExtraElements]
public class FeelingRating
{
    [BsonElement("code")]
    public string? Code { get; set; }

    [BsonElement("customLabel")]
    public string? CustomLabel { get; set; }

    [BsonElement("intensity")]
    public int? Intensity { get; set; }

    [BsonElement("scaleMin")]
    public int ScaleMin { get; set; } = 0;

    [BsonElement("scaleMax")]
    public int ScaleMax { get; set; } = 10;

    [BsonElement("phase")]
    public string Phase { get; set; } = "before";

    [BsonElement("measuredAtUtc")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime MeasuredAtUtc { get; set; } = DateTime.UtcNow;
}
