using Microsoft.Extensions.Logging;
using POS.Core.Exceptions;
using POS.Shared.Results;

namespace POS.Application.Pipelines;

/// <summary>
/// Execution pipeline implementation with centralized error handling and logging
/// </summary>
public class ExecutionPipeline : IExecutionPipeline
{
    private readonly ILogger<ExecutionPipeline> _logger;

    public ExecutionPipeline(ILogger<ExecutionPipeline> logger)
    {
        _logger = logger;
    }

    public async Task<Result> ExecuteAsync(Func<Task> operation, string operationName)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Starting operation: {OperationName}", operationName);

        try
        {
            await operation();
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogInformation("Completed operation: {OperationName} in {Duration}ms", operationName, duration);
            return Result.Success();
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning("Operation {OperationName} failed: {Message}", operationName, ex.Message);
            return Result.Failure(ex.Message);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Operation {OperationName} validation failed: {Message}", operationName, ex.Message);
            return Result.Failure(ex.Message, ex.Errors);
        }
        catch (BusinessException ex)
        {
            _logger.LogWarning("Operation {OperationName} business rule violation: {Message}", operationName, ex.Message);
            return Result.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogError(ex, "Operation {OperationName} failed after {Duration}ms: {Message}", operationName, duration, ex.Message);
            return Result.Failure($"An error occurred: {ex.Message}");
        }
    }

    public async Task<Result<T>> ExecuteAsync<T>(Func<Task<T>> operation, string operationName)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Starting operation: {OperationName}", operationName);

        try
        {
            var result = await operation();
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogInformation("Completed operation: {OperationName} in {Duration}ms", operationName, duration);
            return Result<T>.Success(result);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning("Operation {OperationName} failed: {Message}", operationName, ex.Message);
            return Result<T>.Failure(ex.Message);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Operation {OperationName} validation failed: {Message}", operationName, ex.Message);
            return Result<T>.Failure(ex.Message, ex.Errors);
        }
        catch (BusinessException ex)
        {
            _logger.LogWarning("Operation {OperationName} business rule violation: {Message}", operationName, ex.Message);
            return Result<T>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogError(ex, "Operation {OperationName} failed after {Duration}ms: {Message}", operationName, duration, ex.Message);
            return Result<T>.Failure($"An error occurred: {ex.Message}");
        }
    }
}
