using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Discipline;

/// <summary>
/// Habit insight - weekly AI-generated insights about habits
/// 
/// NOTE: This entity is written by the AI & Scheduling Service for weekly habit insights.
/// It is not used by the Data API and may be empty until the AI service is implemented.
/// </summary>
public class HabitInsight : EntityBase
{
    [BsonElement("weekId")]
    public string WeekId { get; set; } = string.Empty; // YYYY-WW format

    [BsonElement("weakestHabit")]
    public string WeakestHabit { get; set; } = string.Empty;

    [BsonElement("suggestion")]
    public string Suggestion { get; set; } = string.Empty;
}
