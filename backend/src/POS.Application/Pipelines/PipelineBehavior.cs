namespace POS.Application.Pipelines;

/// <summary>
/// Base class for pipeline behaviors
/// </summary>
public abstract class PipelineBehavior<TRequest, TResponse>
{
    protected PipelineBehavior<TRequest, TResponse>? Next { get; set; }

    public void SetNext(PipelineBehavior<TRequest, TResponse> next)
    {
        Next = next;
    }

    public abstract Task<TResponse> HandleAsync(TRequest request, Func<Task<TResponse>> next);
}
