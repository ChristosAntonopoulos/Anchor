namespace POS.Application.DTOs.Today;

/// <summary>
/// Deadline warning DTO for Today response
/// </summary>
public class DeadlineWarningDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int DaysLeft { get; set; }
    public string Status { get; set; } = string.Empty; // on track|behind
}
