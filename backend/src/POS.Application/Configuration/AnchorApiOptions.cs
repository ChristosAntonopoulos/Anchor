namespace POS.Application.Configuration;

/// <summary>
/// Shared API key for assistant/external write access (header X-Anchor-Key).
/// </summary>
public class AnchorApiOptions
{
    public const string SectionName = "AnchorApi";
    public const string HeaderName = "X-Anchor-Key";

    /// <summary>
    /// Shared secret. Empty disables enforcement (local dev).
    /// </summary>
    public string? Key { get; set; }

    /// <summary>
    /// Master switch for X-Anchor-Key checks. Default false (key not required).
    /// When true and Key is set, middleware enforces the header on protected routes.
    /// </summary>
    public bool RequireKey { get; set; } = false;

    /// <summary>
    /// When true and Key is set (and RequireKey is true), require the header on all mutating /api requests
    /// (except health, swagger, and app release which has its own token).
    /// </summary>
    public bool ProtectAllWrites { get; set; } = true;
}
