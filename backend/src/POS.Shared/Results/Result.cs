namespace POS.Shared.Results;

/// <summary>
/// Generic result wrapper for operations that may succeed or fail
/// </summary>
public class Result
{
    public bool IsSuccess { get; private set; }
    public bool IsFailure => !IsSuccess;
    public string? Error { get; private set; }
    public List<ErrorDetail>? Errors { get; private set; }

    protected Result(bool isSuccess, string? error = null, List<ErrorDetail>? errors = null)
    {
        IsSuccess = isSuccess;
        Error = error;
        Errors = errors;
    }

    public static Result Success() => new(true);
    public static Result Failure(string error) => new(false, error);
    public static Result Failure(List<ErrorDetail> errors) => new(false, null, errors);
    public static Result Failure(string error, List<ErrorDetail> errors) => new(false, error, errors);
}

/// <summary>
/// Typed result wrapper for operations that return a value
/// </summary>
public class Result<T> : Result
{
    public T? Value { get; private set; }

    private Result(bool isSuccess, T? value, string? error = null, List<ErrorDetail>? errors = null)
        : base(isSuccess, error, errors)
    {
        Value = value;
    }

    public static Result<T> Success(T value) => new(true, value);
    public static new Result<T> Failure(string error) => new(false, default, error);
    public static new Result<T> Failure(List<ErrorDetail> errors) => new(false, default, null, errors);
    public static new Result<T> Failure(string error, List<ErrorDetail> errors) => new(false, default, error, errors);
}
