namespace POS.Application.Configuration;

/// <summary>
/// Azure DevOps settings for org-wide pipeline status (home launcher widget).
/// </summary>
public class AzureDevOpsOptions
{
    public const string SectionName = "AzureDevOps";

    /// <summary>Organization name used in https://dev.azure.com/{organization}.</summary>
    public string Organization { get; set; } = string.Empty;

    /// <summary>PAT with Build (Read) and Project (Read) scopes. Prefer env/secret injection.</summary>
    public string? PersonalAccessToken { get; set; }

    /// <summary>How long to cache the latest org-wide run (seconds).</summary>
    public int CacheSeconds { get; set; } = 60;
}
