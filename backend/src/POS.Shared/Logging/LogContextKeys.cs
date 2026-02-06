namespace POS.Shared.Logging;

/// <summary>
/// Common log context keys for structured logging
/// </summary>
public static class LogContextKeys
{
    public const string UserId = "UserId";
    public const string EntityType = "EntityType";
    public const string EntityId = "EntityId";
    public const string OperationName = "OperationName";
    public const string Duration = "Duration";
    public const string RequestId = "RequestId";
    public const string CorrelationId = "CorrelationId";
}
