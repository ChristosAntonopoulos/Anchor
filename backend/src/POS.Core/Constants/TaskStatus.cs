namespace POS.Core.Constants;

/// <summary>
/// Lifecycle status for tasks (inbox → today focus → done).
/// </summary>
public static class TaskStatus
{
    public const string Inbox = "inbox";
    public const string Today = "today";
    public const string Done = "done";
    public const string Archived = "archived";
    public const string Snoozed = "snoozed";

    public static readonly string[] All =
        [Inbox, Today, Done, Archived, Snoozed];

    public static bool IsValid(string? status) =>
        !string.IsNullOrWhiteSpace(status) && All.Contains(status);
}
