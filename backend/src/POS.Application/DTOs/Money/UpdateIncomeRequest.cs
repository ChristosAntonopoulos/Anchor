namespace POS.Application.DTOs.Money;

/// <summary>
/// Update income entry request
/// </summary>
public class UpdateIncomeRequest
{
    public string? Date { get; set; } // YYYY-MM-DD format
    public string? Source { get; set; }
    public decimal? Amount { get; set; }
    public string? Currency { get; set; }
}
