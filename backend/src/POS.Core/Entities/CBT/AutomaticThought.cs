using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.CBT;

/// <summary>
/// Automatic thought value object
/// </summary>
public class AutomaticThought
{
    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("emotion")]
    public string? Emotion { get; set; } // Associated emotion

    [BsonElement("intensity")]
    public int? Intensity { get; set; } // 0-10 intensity

    [BsonElement("distortions")]
    public List<string>? Distortions { get; set; } // Cognitive distortions identified
}
