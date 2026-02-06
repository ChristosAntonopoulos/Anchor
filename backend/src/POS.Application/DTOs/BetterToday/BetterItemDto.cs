using POS.Application.DTOs;

namespace POS.Application.DTOs.BetterToday;

/// <summary>
/// Better item DTO
/// </summary>
public class BetterItemDto : ResponseDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability
    public bool Completed { get; set; }
    public DateTime Date { get; set; }
}
