namespace POS.Shared.Results;

/// <summary>
/// Structured error detail for validation and business logic errors
/// </summary>
public class ErrorDetail
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Code { get; set; }

    public ErrorDetail()
    {
    }

    public ErrorDetail(string field, string message, string? code = null)
    {
        Field = field;
        Message = message;
        Code = code;
    }
}
