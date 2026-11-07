namespace POS.Core.Constants;

public static class DayBootstrapStatus
{
    public const string Pending = "pending";
    public const string Processing = "processing";
    public const string Ready = "ready";
    public const string Failed = "failed";
}

public static class TaskSource
{
    public const string User = "user";
    public const string Ai = "ai";
    public const string DayStart = "day-start";
    public const string Notification = "notification";
}
