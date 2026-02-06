using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// User entity - represents a POS user
/// </summary>
public class User : EntityBase
{
    [BsonElement("timezone")]
    public string Timezone { get; set; } = "UTC";
}
