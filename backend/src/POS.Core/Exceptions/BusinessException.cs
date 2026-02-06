namespace POS.Core.Exceptions;

/// <summary>
/// Exception thrown when business logic rules are violated
/// </summary>
public class BusinessException : Exception
{
    public string? ErrorCode { get; }

    public BusinessException(string message)
        : base(message)
    {
    }

    public BusinessException(string message, string errorCode)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public BusinessException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
