namespace POS.Application.DTOs.Category;

/// <summary>
/// Create category request (admin only)
/// </summary>
public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Description { get; set; }
    public int Order { get; set; }
}
