namespace POS.Shared.Results;

/// <summary>
/// Structured error detail for validation and business logic errors
/// </summary>
public class ErrorDetail
{
    /// <summary>
    /// The field or property name that caused the error
    /// </summary>
    /// <example>title</example>
    public string Field { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable error message describing what went wrong
    /// </summary>
    /// <example>Title is required</example>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Optional error code for programmatic error handling
    /// </summary>
    /// <example>REQUIRED_FIELD</example>
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
