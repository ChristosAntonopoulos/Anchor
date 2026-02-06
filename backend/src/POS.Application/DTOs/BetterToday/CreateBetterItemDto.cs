using POS.Application.DTOs;

namespace POS.Application.DTOs.BetterToday;

/// <summary>
/// Create better item DTO
/// </summary>
public class CreateBetterItemDto : CreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability
}
