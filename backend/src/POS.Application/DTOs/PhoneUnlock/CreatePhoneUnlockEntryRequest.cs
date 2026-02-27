using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.PhoneUnlock;

/// <summary>
/// Create phone unlock entry request
/// </summary>
public class CreatePhoneUnlockEntryRequest
{
    /// <summary>
    /// User's reason for unlocking their phone
    /// </summary>
    [Required(ErrorMessage = "Reason is required")]
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp of unlock event (optional - defaults to now)
    /// </summary>
    public DateTime? UnlockedAt { get; set; }

    /// <summary>
    /// How phone was unlocked (optional - if detectable)
    /// </summary>
    [StringLength(50, ErrorMessage = "Unlock method cannot exceed 50 characters")]
    public string? UnlockMethod { get; set; }
}
