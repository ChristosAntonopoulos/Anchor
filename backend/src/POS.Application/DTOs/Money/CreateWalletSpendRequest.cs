using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Money;

public class CreateWalletSpendRequest
{
    [Required]
    [RegularExpression(@"^\d{4}-\d{2}-\d{2}$")]
    public string Date { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Merchant { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 999999999.99)]
    public decimal Amount { get; set; }

    [StringLength(3, MinimumLength = 3)]
    public string Currency { get; set; } = "EUR";

    [Required]
    [StringLength(300)]
    public string SourceNotificationId { get; set; } = string.Empty;

    [StringLength(200)]
    public string PackageName { get; set; } = string.Empty;

    [StringLength(400)]
    public string? RawText { get; set; }
}
