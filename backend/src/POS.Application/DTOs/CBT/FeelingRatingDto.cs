namespace POS.Application.DTOs.CBT;

public class FeelingRatingDto
{
    public string? Code { get; set; }
    public string? CustomLabel { get; set; }
    public int? Intensity { get; set; }
    public int ScaleMin { get; set; } = 0;
    public int ScaleMax { get; set; } = 10;
    public string Phase { get; set; } = "before";
    public DateTime MeasuredAtUtc { get; set; }
}
