namespace POS.Application.DTOs.PhoneUnlock;

/// <summary>
/// Phone unlock entry DTO
/// </summary>
public class PhoneUnlockEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime UnlockedAt { get; set; }
    public string? UnlockMethod { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
