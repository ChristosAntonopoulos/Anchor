using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Discipline;

/// <summary>
/// Habit definition - template for habits
/// 
/// NOTE: This entity is used by the AI & Scheduling Service as a template for habit generation.
/// It is not used by the Data API and may be empty until the AI service is implemented.
/// </summary>
public class HabitDefinition : DefinitionEntity
{
    [BsonElement("key")]
    public string Key { get; set; } = string.Empty; // gym|walk|cooked|diet|meditation|water

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("frequency")]
    public HabitFrequency Frequency { get; set; } = HabitFrequency.Daily;
}

public enum HabitFrequency
{
    Daily,
    Weekly
}
