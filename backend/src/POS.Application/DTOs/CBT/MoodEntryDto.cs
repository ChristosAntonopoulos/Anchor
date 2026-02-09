namespace POS.Application.DTOs.CBT;

/// <summary>
/// Mood Entry DTO
/// </summary>
public class MoodEntryDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Mood { get; set; } = string.Empty;
    public int Intensity { get; set; }
    public string? Notes { get; set; }
    public List<string>? Triggers { get; set; }
    public List<string>? Activities { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
