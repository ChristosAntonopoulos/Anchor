using POS.Application.DTOs;

namespace POS.Application.DTOs.Money;

public class WalletSpendDto : ResponseDto
{
    public string Date { get; set; } = string.Empty;
    public string Merchant { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string SourceNotificationId { get; set; } = string.Empty;
    public string PackageName { get; set; } = string.Empty;
}
