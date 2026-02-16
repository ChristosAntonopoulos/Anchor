using POS.Application.DTOs;

namespace POS.Application.DTOs.BetterToday;

/// <summary>
/// Create better item DTO
/// </summary>
public class CreateBetterItemDto : CreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability
    public DateTime? Date { get; set; } // Optional, defaults to today if not provided
    public string? Source { get; set; } // Optional, defaults to "user" if not provided (use "ai" for AI-generated items)
}
