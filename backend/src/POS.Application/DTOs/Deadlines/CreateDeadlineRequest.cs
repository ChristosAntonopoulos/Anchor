namespace POS.Application.DTOs.Deadlines;

/// <summary>
/// Create deadline request
/// </summary>
public class CreateDeadlineRequest
{
    public string Title { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty; // YYYY-MM-DD format
    public int Importance { get; set; } = 3; // 1-5
}
