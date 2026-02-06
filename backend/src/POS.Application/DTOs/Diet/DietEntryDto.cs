using POS.Application.DTOs;

namespace POS.Application.DTOs.Diet;

/// <summary>
/// Diet entry DTO
/// </summary>
public class DietEntryDto : ResponseDto
{
    public bool Compliant { get; set; }
    public string? PhotoUri { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
}
