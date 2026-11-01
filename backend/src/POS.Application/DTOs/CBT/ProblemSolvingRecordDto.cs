namespace POS.Application.DTOs.CBT;

public class ProblemSolvingRecordDto
{
    public string? SpecificProblem { get; set; }
    public string? ControllablePart { get; set; }
    public List<string>? Options { get; set; }
    public string? SelectedOption { get; set; }
    public string? SmallestNextStep { get; set; }
    public string State { get; set; } = "draft";
}
