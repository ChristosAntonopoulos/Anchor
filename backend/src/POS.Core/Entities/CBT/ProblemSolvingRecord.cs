using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.CBT;

[BsonIgnoreExtraElements]
public class ProblemSolvingRecord
{
    [BsonElement("specificProblem")]
    public string? SpecificProblem { get; set; }

    [BsonElement("controllablePart")]
    public string? ControllablePart { get; set; }

    [BsonElement("options")]
    public List<string>? Options { get; set; }

    [BsonElement("selectedOption")]
    public string? SelectedOption { get; set; }

    [BsonElement("smallestNextStep")]
    public string? SmallestNextStep { get; set; }

    [BsonElement("state")]
    public string State { get; set; } = "draft";
}
