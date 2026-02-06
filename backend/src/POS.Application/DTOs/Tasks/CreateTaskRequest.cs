namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Create task request
/// </summary>
public class CreateTaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // work|leverage|health|stability
}
