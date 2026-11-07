namespace POS.Shared.Results;

/// <summary>
/// Standardized API response format for successful operations with data
/// </summary>
/// <typeparam name="T">Type of the data payload</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Indicates whether the operation was successful
    /// </summary>
    /// <example>true</example>
    public bool Success { get; set; }

    /// <summary>
    /// The response data payload (only present when Success is true)
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Optional success or error message
    /// </summary>
    /// <example>Task created successfully</example>
    public string? Message { get; set; }

    /// <summary>
    /// List of error details (only present when Success is false)
    /// </summary>
    public List<ErrorDetail>? Errors { get; set; }

    /// <summary>
    /// Timestamp when the response was generated (UTC)
    /// </summary>
    /// <example>2024-02-26T15:30:00Z</example>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> SuccessResponse(T data, string? message = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }

    public static ApiResponse<T> ErrorResponse(string message, List<ErrorDetail>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors
        };
    }

    public static ApiResponse<T> ErrorResponse(List<ErrorDetail> errors)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Errors = errors
        };
    }
}

/// <summary>
/// Standardized API response format for operations without return data
/// </summary>
public class ApiResponse
{
    /// <summary>
    /// Indicates whether the operation was successful
    /// </summary>
    /// <example>true</example>
    public bool Success { get; set; }

    /// <summary>
    /// Optional success or error message
    /// </summary>
    /// <example>Task deleted successfully</example>
    public string? Message { get; set; }

    /// <summary>
    /// List of error details (only present when Success is false)
    /// </summary>
    public List<ErrorDetail>? Errors { get; set; }

    /// <summary>
    /// Timestamp when the response was generated (UTC)
    /// </summary>
    /// <example>2024-02-26T15:30:00Z</example>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse SuccessResponse(string? message = null)
    {
        return new ApiResponse
        {
            Success = true,
            Message = message
        };
    }

    public static ApiResponse ErrorResponse(string message, List<ErrorDetail>? errors = null)
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            Errors = errors
        };
    }

    public static ApiResponse ErrorResponse(List<ErrorDetail> errors)
    {
        return new ApiResponse
        {
            Success = false,
            Errors = errors
        };
    }
}
