namespace POS.Application.DTOs.Meals;

public class RecipeVersionDto
{
    public string Id { get; set; } = string.Empty;
    public string RecipeId { get; set; } = string.Empty;
    public int VersionNumber { get; set; } = 1;
    public string NameEl { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string SourceKind { get; set; } = "AiGenerated";
    public string? SourceUrl { get; set; }
    public string? SourceAttribution { get; set; }
    public int YieldServings { get; set; } = 2;
    public List<RecipeIngredientDto> Ingredients { get; set; } = new();
    public List<RecipeStepDto> Steps { get; set; } = new();
    public int HandsonMinutes { get; set; }
    public int TotalMinutes { get; set; }
    public List<string> Equipment { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public string ValidationStatus { get; set; } = "pending";
}

public class RecipeIngredientDto
{
    public string? IngredientId { get; set; }
    public string RawName { get; set; } = string.Empty;
    public string? Form { get; set; }
    public decimal? Amount { get; set; }
    public string? Unit { get; set; }
    public string? QualitativeAmount { get; set; }
    public bool IsOptional { get; set; }
    public List<string> AllergenFlags { get; set; } = new();
}

public class RecipeStepDto
{
    public int StepNumber { get; set; }
    public string Action { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
    public bool IsActive { get; set; }
    public List<int> DependsOnSteps { get; set; } = new();
    public List<string> Equipment { get; set; } = new();
}

public class CreateRecipeRequest
{
    public string NameEl { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public int YieldServings { get; set; } = 2;
    public List<RecipeIngredientDto> Ingredients { get; set; } = new();
    public List<RecipeStepDto> Steps { get; set; } = new();
    public int HandsonMinutes { get; set; }
    public int TotalMinutes { get; set; }
    public List<string> Equipment { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public string? IdempotencyKey { get; set; }
}

public class GenerateRecipeRequest
{
    public string Name { get; set; } = string.Empty;
    public int Servings { get; set; } = 2;
}

public class CookReadyDto
{
    public string PlanId { get; set; } = string.Empty;
    public MealSlotDto Slot { get; set; } = new();
    public RecipeVersionDto Recipe { get; set; } = new();
}
