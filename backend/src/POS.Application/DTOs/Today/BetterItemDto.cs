namespace POS.Application.DTOs.Today;

/// <summary>
/// Better item DTO for Today response
/// </summary>
public class BetterItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability
    public bool Completed { get; set; }
}
