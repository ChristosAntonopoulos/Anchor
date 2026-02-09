namespace POS.Core.Configuration;

/// <summary>
/// Database configuration settings
/// </summary>
public class DatabaseSettings
{
    /// <summary>
    /// Enable or disable automatic database seeding on application startup
    /// Set to true to automatically seed the database if it's empty
    /// Set to false to disable auto-seeding (useful after initial setup)
    /// </summary>
    public bool AutoSeedOnStartup { get; set; } = true;
}
