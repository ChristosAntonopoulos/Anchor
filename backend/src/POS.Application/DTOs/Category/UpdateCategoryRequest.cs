namespace POS.Application.DTOs.Category;

/// <summary>
/// Update category request (admin only)
/// </summary>
public class UpdateCategoryRequest
{
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public string? Description { get; set; }
    public int? Order { get; set; }
    public bool? IsActive { get; set; }
}
