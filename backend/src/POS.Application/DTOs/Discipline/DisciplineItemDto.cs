namespace POS.Application.DTOs.Discipline;

/// <summary>
/// Discipline item DTO
/// </summary>
public class DisciplineItemDto
{
    public string ItemId { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "toggle" | "counter"
    public bool? ToggleValue { get; set; }
    public int? CounterValue { get; set; }
}
