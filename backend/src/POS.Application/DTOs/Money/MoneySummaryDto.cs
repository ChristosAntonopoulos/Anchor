namespace POS.Application.DTOs.Money;

/// <summary>
/// Money summary DTO
/// </summary>
public class MoneySummaryDto
{
    public decimal MonthlyTotal { get; set; }
    public int DaysSinceLastIncome { get; set; }
    public List<IncomeEntryDto> Income { get; set; } = new();
    public decimal MonthlyWalletSpend { get; set; }
    public List<WalletSpendDto> WalletSpend { get; set; } = new();
}
