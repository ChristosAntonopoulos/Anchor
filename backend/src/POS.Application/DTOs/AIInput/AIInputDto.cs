using POS.Application.DTOs;

namespace POS.Application.DTOs.AIInput;

/// <summary>
/// AI Input DTO
/// </summary>
public class AIInputDto : ResponseDto
{
    public string Text { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ProcessedAt { get; set; }
    public string? Result { get; set; }
    public string? Error { get; set; }
}
