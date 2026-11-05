using System.ComponentModel.DataAnnotations;

namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Complete task request
/// </summary>
public class CompleteTaskRequest
{
    /// <summary>
    /// Task ID to complete (required)
    /// </summary>
    [Required(ErrorMessage = "Id is required")]
    public string Id { get; set; } = string.Empty;
}
