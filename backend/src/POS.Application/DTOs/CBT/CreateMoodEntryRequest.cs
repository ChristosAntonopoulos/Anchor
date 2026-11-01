namespace POS.Application.DTOs.CBT;

/// <summary>
/// Create mood entry request
/// </summary>
public class CreateMoodEntryRequest
{
    public DateTime Date { get; set; }
    public string Mood { get; set; } = string.Empty;
    public int Intensity { get; set; }
    public string? Notes { get; set; }
    public List<string>? Triggers { get; set; }
    public List<string>? Activities { get; set; }
}
