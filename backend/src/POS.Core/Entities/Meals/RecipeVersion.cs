using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Meals;

/// <summary>
/// Immutable snapshot of a recipe. Editing a recipe creates a new version;
/// existing meal plans reference the version they were planned with.
/// </summary>
public class RecipeVersion : EntityBase
{
    [BsonElement("recipeId")]
    public string RecipeId { get; set; } = string.Empty;

    [BsonElement("versionNumber")]
    public int VersionNumber { get; set; } = 1;

    [BsonElement("nameEl")]
    public string NameEl { get; set; } = string.Empty;

    [BsonElement("nameEn")]
    public string NameEn { get; set; } = string.Empty;

    [BsonElement("sourceKind")]
    public RecipeSourceKind SourceKind { get; set; } = RecipeSourceKind.AiGenerated;

    [BsonElement("sourceUrl")]
    public string? SourceUrl { get; set; }

    [BsonElement("sourceAttribution")]
    public string? SourceAttribution { get; set; }

    [BsonElement("yieldServings")]
    public int YieldServings { get; set; } = 2;

    [BsonElement("ingredients")]
    public List<RecipeIngredient> Ingredients { get; set; } = new();

    [BsonElement("steps")]
    public List<RecipeStep> Steps { get; set; } = new();

    [BsonElement("handsonMinutes")]
    public int HandsonMinutes { get; set; }

    [BsonElement("totalMinutes")]
    public int TotalMinutes { get; set; }

    [BsonElement("equipment")]
    public List<string> Equipment { get; set; } = new();

    [BsonElement("tags")]
    public List<string> Tags { get; set; } = new();

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("validationStatus")]
    public string ValidationStatus { get; set; } = "pending";

    [BsonElement("guidanceRefs")]
    public List<string> GuidanceRefs { get; set; } = new();
}

public class RecipeIngredient
{
    [BsonElement("ingredientId")]
    public string? IngredientId { get; set; }

    [BsonElement("rawName")]
    public string RawName { get; set; } = string.Empty;

    [BsonElement("form")]
    public string? Form { get; set; }

    [BsonElement("amount")]
    public decimal? Amount { get; set; }

    [BsonElement("unit")]
    public string? Unit { get; set; }

    [BsonElement("qualitativeAmount")]
    public string? QualitativeAmount { get; set; }

    [BsonElement("isOptional")]
    public bool IsOptional { get; set; } = false;

    [BsonElement("allergenFlags")]
    public List<string> AllergenFlags { get; set; } = new();
}

public class RecipeStep
{
    [BsonElement("stepNumber")]
    public int StepNumber { get; set; }

    [BsonElement("action")]
    public string Action { get; set; } = string.Empty;

    [BsonElement("durationMinutes")]
    public int? DurationMinutes { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("dependsOnSteps")]
    public List<int> DependsOnSteps { get; set; } = new();

    [BsonElement("equipment")]
    public List<string> Equipment { get; set; } = new();

    [BsonElement("ingredientRefs")]
    public List<string> IngredientRefs { get; set; } = new();
}

public enum RecipeSourceKind
{
    AiGenerated,
    UserImported,
    Curated
}
