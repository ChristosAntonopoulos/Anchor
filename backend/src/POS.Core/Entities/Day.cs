using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// Day entity - anchor for daily instances
/// </summary>
public class Day : DayAnchoredEntity
{
    [BsonElement("focusCategory")]
    public string? FocusCategory { get; set; } // work|leverage|health|stability

    /// <summary>
    /// Flattened detailed AI morning report for Better Today / daily task planning.
    /// </summary>
    [BsonElement("aiReport")]
    public string? AiReport { get; set; }
}
