using System;
using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.AIInput;

/// <summary>
/// Raw user input waiting for AI processing
/// </summary>
public class AIInput : EntityBase
{
    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "pending"; // pending|processing|completed|failed

    [BsonElement("processedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ProcessedAt { get; set; }

    [BsonElement("result")]
    public string? Result { get; set; } // task|schedule|deadline|none

    [BsonElement("error")]
    public string? Error { get; set; }
}
