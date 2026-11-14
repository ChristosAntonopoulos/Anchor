namespace POS.Application.DTOs.Pipelines;

/// <summary>
/// Latest Azure DevOps pipeline run across the whole organization.
/// </summary>
public class LatestPipelineRunDto
{
    /// <summary>Configured / available — false when ADO is not configured or unreachable.</summary>
    public bool Available { get; set; }

    /// <summary>Calm empty-state message when <see cref="Available"/> is false.</summary>
    public string? Message { get; set; }

    /// <summary>Glance status: running, succeeded, failed, partial, canceled, queued, unknown.</summary>
    public string Status { get; set; } = "unknown";

    /// <summary>Pipeline / definition display name.</summary>
    public string? Name { get; set; }

    /// <summary>Azure DevOps project name.</summary>
    public string? Project { get; set; }

    /// <summary>Branch without refs/heads/ prefix when possible.</summary>
    public string? Branch { get; set; }

    /// <summary>Build number from Azure DevOps.</summary>
    public string? BuildNumber { get; set; }

    /// <summary>UTC timestamp of the run (finish → start → queue).</summary>
    public DateTime? OccurredAtUtc { get; set; }

    /// <summary>Local wall time in Europe/Athens (or configured display TZ), e.g. 19:42.</summary>
    public string? LocalTime { get; set; }

    /// <summary>IANA timezone used for <see cref="LocalTime"/>.</summary>
    public string Timezone { get; set; } = "Europe/Athens";

    /// <summary>Deep link into Azure DevOps for this run when available.</summary>
    public string? WebUrl { get; set; }

    /// <summary>Preformatted title for small widgets (status · name).</summary>
    public string Title { get; set; } = "No pipeline yet";

    /// <summary>Preformatted subtitle (project · branch · local time).</summary>
    public string Subtitle { get; set; } = string.Empty;

    /// <summary>
    /// All currently active (running / queued) org-wide builds.
    /// Empty when none are in progress. Nested items leave this empty.
    /// </summary>
    public List<LatestPipelineRunDto> Active { get; set; } = new();
}
