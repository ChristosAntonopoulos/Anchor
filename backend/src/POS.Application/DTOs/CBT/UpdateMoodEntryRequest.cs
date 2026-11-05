namespace POS.Application.DTOs.CBT;

/// <summary>
/// Update mood entry request
/// </summary>
public class UpdateMoodEntryRequest
{
    public DateTime? Date { get; set; }
    public string? Mood { get; set; }
    public int? Intensity { get; set; } // 0-10 scale
    public string? Notes { get; set; }
    public List<string>? Triggers { get; set; }
    public List<string>? Activities { get; set; }
}
