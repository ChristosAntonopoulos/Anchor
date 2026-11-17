using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Devices;

/// <summary>
/// Expo / FCM push token registered by a device for a user.
/// </summary>
[BsonIgnoreExtraElements]
public class DevicePushToken : EntityBase
{
    [BsonElement("token")]
    public string Token { get; set; } = string.Empty;

    [BsonElement("platform")]
    public string Platform { get; set; } = "android";

    [BsonElement("expoProjectId")]
    public string? ExpoProjectId { get; set; }

    [BsonElement("lastSeenAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
}
