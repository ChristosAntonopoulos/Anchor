using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Morning;

[BsonIgnoreExtraElements]
public class MorningModeSession : EntityBase
{
    [BsonElement("localDate")]
    public string LocalDate { get; set; } = string.Empty;

    [BsonElement("timezone")]
    public string Timezone { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "WAITING_FOR_FIRST_UNLOCK";

    [BsonElement("payloadJson")]
    public string PayloadJson { get; set; } = "{}";
}
