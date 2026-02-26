namespace POS.Application.DTOs.PhoneUnlock;

/// <summary>
/// Create phone unlock entry request
/// </summary>
public class CreatePhoneUnlockEntryRequest
{
    /// <summary>
    /// User's reason for unlocking their phone
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp of unlock event (optional - defaults to now)
    /// </summary>
    public DateTime? UnlockedAt { get; set; }

    /// <summary>
    /// How phone was unlocked (optional - if detectable)
    /// </summary>
    public string? UnlockMethod { get; set; }
}
