namespace POS.Application.DTOs;

/// <summary>
/// Base DTO for update operations
/// </summary>
public abstract class UpdateDto
{
    public string Id { get; set; } = string.Empty;
}
