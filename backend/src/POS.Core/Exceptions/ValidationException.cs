using POS.Shared.Results;

namespace POS.Core.Exceptions;

/// <summary>
/// Exception thrown when validation fails
/// </summary>
public class ValidationException : Exception
{
    public List<ErrorDetail> Errors { get; }

    public ValidationException(List<ErrorDetail> errors)
        : base("Validation failed. See Errors for details.")
    {
        Errors = errors;
    }

    public ValidationException(string message, List<ErrorDetail> errors)
        : base(message)
    {
        Errors = errors;
    }

    public ValidationException(string field, string message)
        : base(message)
    {
        Errors = new List<ErrorDetail> { new ErrorDetail(field, message) };
    }
}
