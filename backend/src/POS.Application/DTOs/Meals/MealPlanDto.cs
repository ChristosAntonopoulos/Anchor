namespace POS.Application.DTOs.Meals;

public class MealPlanDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime WeekStartDate { get; set; }
    public DateTime WeekEndDate { get; set; }
    public List<MealSlotDto> Slots { get; set; } = new();
    public string Status { get; set; } = "Draft";
    public int Version { get; set; }
}

public class MealSlotDto
{
    public string Id { get; set; } = string.Empty;
    public string LocalDate { get; set; } = string.Empty;
    public string Slot { get; set; } = "Dinner";
    public string Kind { get; set; } = "FreshCook";
    public string? RecipeVersionId { get; set; }
    public string? RecipeName { get; set; }
    public int Servings { get; set; } = 1;
    public bool Locked { get; set; } = false;
    public string? SourceMealSlotId { get; set; }
    public string? ReasonSummary { get; set; }
    public int? HandsonMinutes { get; set; }
    public int? TotalMinutes { get; set; }
    public string State { get; set; } = "Planned";
    public string? CookEventId { get; set; }
    public List<string> MissingIngredients { get; set; } = new();
    public List<string> UncertainIngredients { get; set; } = new();
}

public class CreateMealPlanRequest
{
    public DateTime WeekStartDate { get; set; }
    public DateTime WeekEndDate { get; set; }
    public List<CreateMealSlotRequest> Slots { get; set; } = new();
    public string? IdempotencyKey { get; set; }
}

public class CreateMealSlotRequest
{
    public string LocalDate { get; set; } = string.Empty;
    public string Slot { get; set; } = "Dinner";
    public string Kind { get; set; } = "FreshCook";
    public string? RecipeVersionId { get; set; }
    public string? RecipeName { get; set; }
    public int Servings { get; set; } = 1;
    public bool Locked { get; set; } = false;
    public string? ReasonSummary { get; set; }
    public int? HandsonMinutes { get; set; }
    public int? TotalMinutes { get; set; }
}

public class UpdateMealSlotRequest
{
    public string SlotId { get; set; } = string.Empty;
    public string? Kind { get; set; }
    public string? RecipeVersionId { get; set; }
    public string? RecipeName { get; set; }
    public int? Servings { get; set; }
    public bool? Locked { get; set; }
    public string? State { get; set; }
    public string? IdempotencyKey { get; set; }
}

public class TodayMealCardDto
{
    public MealSlotDto? NextMeal { get; set; }
    public string? ActionableReminder { get; set; }
    public bool HasUnconfirmedIngredients { get; set; }
}
