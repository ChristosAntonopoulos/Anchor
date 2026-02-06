using POS.Application.DTOs;

namespace POS.Application.DTOs.Money;

/// <summary>
/// Income entry DTO
/// </summary>
public class IncomeEntryDto : ResponseDto
{
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD format
    public string Source { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
}
