namespace POS.Application.DTOs.Meals;

public class CompleteCookRequest
{
    public string MealSlotId { get; set; } = string.Empty;
    public string? RecipeVersionId { get; set; }
    public string Outcome { get; set; } = "Cooked";
    public int? ActualServings { get; set; }
    public int? ActualHandsonMinutes { get; set; }
    public List<IngredientAdjustmentDto> IngredientAdjustments { get; set; } = new();
    public List<StoredPortionDto> StoredPortions { get; set; } = new();
    public string? FeedbackMakeAgain { get; set; }
    public string? FeedbackReason { get; set; }
    public string? IdempotencyKey { get; set; }
}

public class IngredientAdjustmentDto
{
    public string? IngredientId { get; set; }
    public string RawName { get; set; } = string.Empty;
    public decimal? AmountUsed { get; set; }
    public string? Unit { get; set; }
    public string? BatchId { get; set; }
}

public class StoredPortionDto
{
    public string Description { get; set; } = string.Empty;
    public decimal Portions { get; set; }
    public string Location { get; set; } = "Fridge";
    public DateTime? StoredAt { get; set; }
}

public class CookEventDto
{
    public string Id { get; set; } = string.Empty;
    public string MealSlotId { get; set; } = string.Empty;
    public string? RecipeVersionId { get; set; }
    public string Outcome { get; set; } = "Cooked";
    public int? ActualServings { get; set; }
    public DateTime? CookedAt { get; set; }
    public int? ActualHandsonMinutes { get; set; }
    public List<StoredPortionDto> StoredPortions { get; set; } = new();
    public string? FeedbackMakeAgain { get; set; }
    public string? FeedbackReason { get; set; }
}
