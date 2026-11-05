namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Subtask DTO
/// </summary>
public class SubtaskDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public int? Order { get; set; }
}
