namespace POS.Application.DTOs.Today;

/// <summary>
/// Diet entry DTO for Today response
/// </summary>
public class DietEntryDto
{
    public bool Compliant { get; set; }
    public string? PhotoUri { get; set; }
    public string? Note { get; set; }
}
