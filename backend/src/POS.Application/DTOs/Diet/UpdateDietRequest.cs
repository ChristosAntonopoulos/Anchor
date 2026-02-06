namespace POS.Application.DTOs.Diet;

/// <summary>
/// Update diet request
/// </summary>
public class UpdateDietRequest
{
    public bool? Compliant { get; set; }
    public string? PhotoUri { get; set; }
    public string? Note { get; set; }
}
