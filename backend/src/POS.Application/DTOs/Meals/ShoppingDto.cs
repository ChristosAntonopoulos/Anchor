namespace POS.Application.DTOs.Meals;

public class ShoppingTripDto
{
    public string Id { get; set; } = string.Empty;
    public string MealPlanId { get; set; } = string.Empty;
    public DateTime? PlannedDate { get; set; }
    public string? PlannedWindow { get; set; }
    public List<ShoppingLineDto> Lines { get; set; } = new();
    public string Status { get; set; } = "Planned";
    public DateTime? CompletedAt { get; set; }
    public decimal? ReceiptTotalEur { get; set; }
    public decimal? ConfirmedPriceTotal { get; set; }
    public int UnpricedItems { get; set; }
}

public class ShoppingLineDto
{
    public string Id { get; set; } = string.Empty;
    public string? IngredientId { get; set; }
    public string RawName { get; set; } = string.Empty;
    public decimal RequiredAmount { get; set; }
    public string Unit { get; set; } = "g";
    public string? SuggestedPackSize { get; set; }
    public string? WhyNeeded { get; set; }
    public string? FirstRequiredDate { get; set; }
    public decimal? EstimatedPriceEur { get; set; }
    public string? PriceSource { get; set; }
    public bool IsChecked { get; set; }
    public bool IsUnavailable { get; set; }
    public decimal? BoughtAmount { get; set; }
    public string? Category { get; set; }
    public bool IsCheckAtHome { get; set; }
}

public class FinishShoppingRequest
{
    public string TripId { get; set; } = string.Empty;
    public List<ShoppingLineUpdateDto> Lines { get; set; } = new();
    public decimal? ReceiptTotalEur { get; set; }
    public string? IdempotencyKey { get; set; }
}

public class ShoppingLineUpdateDto
{
    public string LineId { get; set; } = string.Empty;
    public bool IsChecked { get; set; }
    public bool IsUnavailable { get; set; }
    public decimal? BoughtAmount { get; set; }
}

public class UpdateShoppingLineRequest
{
    public string LineId { get; set; } = string.Empty;
    public bool? IsChecked { get; set; }
    public bool? IsUnavailable { get; set; }
    public decimal? BoughtAmount { get; set; }
}
