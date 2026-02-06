using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities;

/// <summary>
/// Base class for definition/template/rule entities
/// </summary>
public abstract class DefinitionEntity : EntityBase
{
    [BsonElement("enabled")]
    public bool Enabled { get; set; } = true;

    [BsonElement("priority")]
    public int Priority { get; set; } = 3;
}
