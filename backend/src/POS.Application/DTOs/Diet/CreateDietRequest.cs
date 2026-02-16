namespace POS.Application.DTOs.Diet;

/// <summary>
/// Create diet entry request
/// </summary>
public class CreateDietRequest
{
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD format
    public bool? Compliant { get; set; }
    public string? PhotoUri { get; set; }
    public string? Note { get; set; }
}
