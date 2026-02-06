namespace POS.Application.DTOs.Today;

/// <summary>
/// Task DTO for Today response
/// </summary>
public class TaskDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability
    public bool Completed { get; set; }
}
