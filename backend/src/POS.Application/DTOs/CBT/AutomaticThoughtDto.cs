namespace POS.Application.DTOs.CBT;

/// <summary>
/// Automatic thought DTO
/// </summary>
public class AutomaticThoughtDto
{
    public string Text { get; set; } = string.Empty;
    public string? Emotion { get; set; }
    public int? Intensity { get; set; }
    public List<string>? Distortions { get; set; }
}
