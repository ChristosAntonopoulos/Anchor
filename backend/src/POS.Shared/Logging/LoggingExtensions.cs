using Microsoft.Extensions.Logging;

namespace POS.Shared.Logging;

/// <summary>
/// Extension methods for structured logging
/// </summary>
public static class LoggingExtensions
{
    /// <summary>
    /// Logs an operation start with context
    /// </summary>
    public static void LogOperationStart(this ILogger logger, string operationName, string? userId = null)
    {
        using (logger.BeginScope(new Dictionary<string, object>
        {
            [LogContextKeys.OperationName] = operationName
        }))
        {
            if (!string.IsNullOrEmpty(userId))
            {
                logger.LogInformation("Starting operation: {OperationName} for user {UserId}", operationName, userId);
            }
            else
            {
                logger.LogInformation("Starting operation: {OperationName}", operationName);
            }
        }
    }

    /// <summary>
    /// Logs an operation completion with duration
    /// </summary>
    public static void LogOperationComplete(this ILogger logger, string operationName, double durationMs, string? userId = null)
    {
        using (logger.BeginScope(new Dictionary<string, object>
        {
            [LogContextKeys.OperationName] = operationName,
            [LogContextKeys.Duration] = durationMs
        }))
        {
            if (!string.IsNullOrEmpty(userId))
            {
                logger.LogInformation("Completed operation: {OperationName} in {Duration}ms for user {UserId}", 
                    operationName, durationMs, userId);
            }
            else
            {
                logger.LogInformation("Completed operation: {OperationName} in {Duration}ms", operationName, durationMs);
            }
        }
    }

    /// <summary>
    /// Logs entity operations with context
    /// </summary>
    public static void LogEntityOperation(this ILogger logger, string operation, string entityType, string entityId, string? userId = null)
    {
        using (logger.BeginScope(new Dictionary<string, object>
        {
            [LogContextKeys.EntityType] = entityType,
            [LogContextKeys.EntityId] = entityId
        }))
        {
            if (!string.IsNullOrEmpty(userId))
            {
                logger.LogInformation("{Operation} {EntityType} {EntityId} for user {UserId}", 
                    operation, entityType, entityId, userId);
            }
            else
            {
                logger.LogInformation("{Operation} {EntityType} {EntityId}", operation, entityType, entityId);
            }
        }
    }
}
