using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Money;

/// <summary>
/// Create income request
/// </summary>
public class CreateIncomeRequest
{
    /// <summary>
    /// Date of income entry (required). Format: YYYY-MM-DD
    /// </summary>
    [Required(ErrorMessage = "Date is required")]
    [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be in YYYY-MM-DD format")]
    public string Date { get; set; } = string.Empty;

    /// <summary>
    /// Income source (required)
    /// </summary>
    [Required(ErrorMessage = "Source is required")]
    [StringLength(200, ErrorMessage = "Source cannot exceed 200 characters")]
    public string Source { get; set; } = string.Empty;

    /// <summary>
    /// Income amount (required)
    /// </summary>
    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, 999999999.99, ErrorMessage = "Amount must be between 0.01 and 999999999.99")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Currency code (optional, defaults to EUR). Format: ISO 4217 currency code
    /// </summary>
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-character ISO code")]
    public string Currency { get; set; } = "EUR";
}
