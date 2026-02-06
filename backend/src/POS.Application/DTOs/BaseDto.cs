namespace POS.Application.DTOs;

/// <summary>
/// Base DTO with common properties
/// </summary>
public abstract class BaseDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
