using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Tasks;

/// <summary>
/// Location - GPS coordinates and address information for a task
/// </summary>
public class Location
{
    [BsonElement("latitude")]
    public double? Latitude { get; set; }

    [BsonElement("longitude")]
    public double? Longitude { get; set; }

    [BsonElement("address")]
    public string? Address { get; set; }

    [BsonElement("placeName")]
    public string? PlaceName { get; set; } // e.g., "Coffee Shop", "Office"
}
