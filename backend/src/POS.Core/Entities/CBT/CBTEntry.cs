using System;
using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.CBT;

/// <summary>
/// CBT Entry - Main entry point for CBT journaling
/// </summary>
public class CBTEntry : EntityBase
{
    [BsonElement("text")]
    public string Text { get; set; } = string.Empty; // Raw user input (free-form text)

    [BsonElement("mood")]
    public string? Mood { get; set; } // Detected mood (happy, anxious, sad, angry, etc.)

    [BsonElement("moodIntensity")]
    public int? MoodIntensity { get; set; } // 0-10 scale

    [BsonElement("situation")]
    public string? Situation { get; set; } // Context/situation description (AI extracted)

    [BsonElement("automaticThoughts")]
    public List<AutomaticThought>? AutomaticThoughts { get; set; } // Extracted automatic thoughts

    [BsonElement("cognitiveDistortions")]
    public List<string>? CognitiveDistortions { get; set; } // Identified distortions

    [BsonElement("evidenceFor")]
    public List<string>? EvidenceFor { get; set; } // Evidence supporting the thought

    [BsonElement("evidenceAgainst")]
    public List<string>? EvidenceAgainst { get; set; } // Evidence challenging the thought

    [BsonElement("alternativeThoughts")]
    public List<string>? AlternativeThoughts { get; set; } // Balanced/alternative perspectives

    [BsonElement("behaviors")]
    public List<string>? Behaviors { get; set; } // Associated behaviors

    [BsonElement("outcome")]
    public string? Outcome { get; set; } // Outcome/result after cognitive restructuring

    [BsonElement("status")]
    public string Status { get; set; } = "pending"; // pending|processing|completed|failed

    [BsonElement("processedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? ProcessedAt { get; set; } // When AI finished processing

    [BsonElement("aiInsights")]
    public string? AIInsights { get; set; } // AI-generated insights/summary
}
