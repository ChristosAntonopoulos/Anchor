namespace POS.Application.DTOs.Deadlines;

/// <summary>
/// Update deadline request
/// </summary>
public class UpdateDeadlineRequest
{
    public string Id { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? DueDate { get; set; } // YYYY-MM-DD format
    public string? Status { get; set; } // on track|behind|completed
    public int? Importance { get; set; } // 1-5
}
