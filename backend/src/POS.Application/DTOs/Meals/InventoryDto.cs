namespace POS.Application.DTOs.Meals;

public class InventoryBatchDto
{
    public string Id { get; set; } = string.Empty;
    public string? IngredientId { get; set; }
    public string RawName { get; set; } = string.Empty;
    public string Form { get; set; } = "raw";
    public decimal CurrentAmount { get; set; }
    public string Unit { get; set; } = "g";
    public bool AmountIsApproximate { get; set; }
    public string Location { get; set; } = "Fridge";
    public string? PrintedDateText { get; set; }
    public DateTime? PrintedDate { get; set; }
    public string DateType { get; set; } = "Unknown";
    public DateTime? OpenedAt { get; set; }
    public DateTime? FrozenAt { get; set; }
    public DateTime? ThawedAt { get; set; }
    public DateTime? PurchasedAt { get; set; }
    public string? LabelStorageInstructions { get; set; }
    public bool IsDiscarded { get; set; }
    public bool IsConsumed { get; set; }
    public string Confidence { get; set; } = "UserConfirmed";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public int Version { get; set; }
}

public class AddInventoryBatchRequest
{
    public string? IngredientId { get; set; }
    public string RawName { get; set; } = string.Empty;
    public string Form { get; set; } = "raw";
    public decimal Amount { get; set; }
    public string Unit { get; set; } = "g";
    public bool AmountIsApproximate { get; set; } = false;
    public string Location { get; set; } = "Fridge";
    public string? PrintedDateText { get; set; }
    public DateTime? PrintedDate { get; set; }
    public string DateType { get; set; } = "Unknown";
    public bool? IsOpened { get; set; }
    public DateTime? OpenedAt { get; set; }
    public DateTime? PurchasedAt { get; set; }
    public string? LabelStorageInstructions { get; set; }
    public string? Notes { get; set; }
    public string? IdempotencyKey { get; set; }
}

public class UpdateInventoryBatchRequest
{
    public string Id { get; set; } = string.Empty;
    public decimal? CurrentAmount { get; set; }
    public bool? AmountIsApproximate { get; set; }
    public string? Location { get; set; }
    public string? DateType { get; set; }
    public DateTime? PrintedDate { get; set; }
    public string? PrintedDateText { get; set; }
    public DateTime? OpenedAt { get; set; }
    public string? Notes { get; set; }
    public int ExpectedVersion { get; set; } = 0;
}

public class DiscardBatchRequest
{
    public string Id { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? IdempotencyKey { get; set; }
}

public class InventoryListDto
{
    public List<InventoryBatchDto> UseSoon { get; set; } = new();
    public List<InventoryBatchDto> Fridge { get; set; } = new();
    public List<InventoryBatchDto> Freezer { get; set; } = new();
    public List<InventoryBatchDto> Cupboard { get; set; } = new();
}
