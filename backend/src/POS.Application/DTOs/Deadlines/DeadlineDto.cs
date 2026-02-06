using POS.Application.DTOs;

namespace POS.Application.DTOs.Deadlines;

/// <summary>
/// Deadline DTO
/// </summary>
public class DeadlineDto : ResponseDto
{
    public string Title { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty; // YYYY-MM-DD format
    public string Status { get; set; } = string.Empty; // on track|behind|completed
    public int Importance { get; set; } = 3; // 1-5
    public int? DaysLeft { get; set; } // Calculated field
}
