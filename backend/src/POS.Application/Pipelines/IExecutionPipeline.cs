using POS.Shared.Results;

namespace POS.Application.Pipelines;

/// <summary>
/// Execution pipeline interface for request processing
/// </summary>
public interface IExecutionPipeline
{
    Task<Result> ExecuteAsync(Func<Task> operation, string operationName);
    Task<Result<T>> ExecuteAsync<T>(Func<Task<T>> operation, string operationName);
}
