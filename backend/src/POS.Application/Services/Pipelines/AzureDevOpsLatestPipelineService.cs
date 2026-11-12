using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using POS.Application.Configuration;
using POS.Application.DTOs.Pipelines;

namespace POS.Application.Services.Pipelines;

/// <summary>
/// Fetches the most recent Azure DevOps pipeline run across every project in the org.
/// </summary>
public class AzureDevOpsLatestPipelineService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static readonly object CacheLock = new();
    private static LatestPipelineRunDto? Cached;
    private static DateTime CachedAtUtc = DateTime.MinValue;

    private readonly HttpClient _httpClient;
    private readonly AzureDevOpsOptions _options;
    private readonly ILogger<AzureDevOpsLatestPipelineService> _logger;

    public AzureDevOpsLatestPipelineService(
        HttpClient httpClient,
        IOptions<AzureDevOpsOptions> options,
        ILogger<AzureDevOpsLatestPipelineService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<LatestPipelineRunDto> GetLatestAsync(CancellationToken ct = default)
    {
        var cacheSeconds = Math.Clamp(_options.CacheSeconds, 15, 300);
        lock (CacheLock)
        {
            if (Cached != null && (DateTime.UtcNow - CachedAtUtc).TotalSeconds < cacheSeconds)
            {
                return Cached;
            }
        }

        var result = await FetchLatestAsync(ct);

        lock (CacheLock)
        {
            Cached = result;
            CachedAtUtc = DateTime.UtcNow;
        }

        return result;
    }

    private async Task<LatestPipelineRunDto> FetchLatestAsync(CancellationToken ct)
    {
        var organization = _options.Organization?.Trim();
        var pat = ResolvePat();

        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(pat))
        {
            return Unavailable("Azure DevOps is not configured.");
        }

        try
        {
            var authorize = CreateAuthorizer(pat);
            var projects = await ListProjectsAsync(organization, authorize, ct);
            if (projects.Count == 0)
            {
                return Unavailable("No Azure DevOps projects found.");
            }

            var builds = new List<AdoBuild>();
            var tasks = projects.Select(async project =>
            {
                var latest = await GetLatestBuildAsync(organization, project.Name, authorize, ct);
                if (latest != null)
                {
                    latest.ProjectName = project.Name;
                    lock (builds)
                    {
                        builds.Add(latest);
                    }
                }
            });
            await Task.WhenAll(tasks);

            if (builds.Count == 0)
            {
                return Unavailable("No pipeline runs yet.");
            }

            var newest = builds
                .OrderByDescending(b => b.SortTime())
                .First();

            return Map(newest, organization);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load org-wide Azure DevOps pipeline status");
            return Unavailable("Could not load pipeline status.");
        }
    }

    private string? ResolvePat()
    {
        if (!string.IsNullOrWhiteSpace(_options.PersonalAccessToken))
        {
            return _options.PersonalAccessToken.Trim();
        }

        return Environment.GetEnvironmentVariable("AZURE_DEVOPS_PAT")
            ?? Environment.GetEnvironmentVariable("AzureDevOps__PersonalAccessToken");
    }

    private static Action<HttpRequestMessage> CreateAuthorizer(string pat)
    {
        var token = Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}"));
        return request =>
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", token);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        };
    }

    private async Task<List<AdoProject>> ListProjectsAsync(
        string organization,
        Action<HttpRequestMessage> authorize,
        CancellationToken ct)
    {
        var url = $"https://dev.azure.com/{Uri.EscapeDataString(organization)}/_apis/projects?api-version=7.1&$top=100";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        authorize(request);

        using var response = await _httpClient.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("ADO projects list failed: {Status} {Body}", (int)response.StatusCode, Truncate(body));
            response.EnsureSuccessStatusCode();
        }

        var parsed = JsonSerializer.Deserialize<AdoListResponse<AdoProject>>(body, JsonOptions);
        return parsed?.Value ?? new List<AdoProject>();
    }

    private async Task<AdoBuild?> GetLatestBuildAsync(
        string organization,
        string project,
        Action<HttpRequestMessage> authorize,
        CancellationToken ct)
    {
        var url =
            $"https://dev.azure.com/{Uri.EscapeDataString(organization)}/{Uri.EscapeDataString(project)}"
            + "/_apis/build/builds?api-version=7.1&$top=1&queryOrder=queueTimeDescending";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        authorize(request);

        using var response = await _httpClient.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogDebug(
                "ADO builds list failed for {Project}: {Status}",
                project,
                (int)response.StatusCode);
            return null;
        }

        var parsed = JsonSerializer.Deserialize<AdoListResponse<AdoBuild>>(body, JsonOptions);
        return parsed?.Value?.FirstOrDefault();
    }

    private static LatestPipelineRunDto Map(AdoBuild build, string organization)
    {
        var status = NormalizeStatus(build.Status, build.Result);
        var name = build.Definition?.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            name = "Pipeline";
        }

        var branch = NormalizeBranch(build.SourceBranch);
        var project = build.ProjectName ?? build.Project?.Name;
        var occurred = build.SortTime();
        var localTime = FormatAthensTime(occurred);
        var webUrl = build.Links?.Web?.Href
            ?? $"https://dev.azure.com/{Uri.EscapeDataString(organization)}/{Uri.EscapeDataString(project ?? "")}/_build/results?buildId={build.Id}";

        var subtitleParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(project) && !string.Equals(project, name, StringComparison.OrdinalIgnoreCase))
        {
            subtitleParts.Add(project!);
        }

        if (!string.IsNullOrWhiteSpace(branch))
        {
            subtitleParts.Add(branch!);
        }

        if (!string.IsNullOrWhiteSpace(localTime))
        {
            subtitleParts.Add(localTime!);
        }

        return new LatestPipelineRunDto
        {
            Available = true,
            Status = status,
            Name = name,
            Project = project,
            Branch = branch,
            BuildNumber = build.BuildNumber,
            OccurredAtUtc = occurred == DateTime.MinValue ? null : DateTime.SpecifyKind(occurred, DateTimeKind.Utc),
            LocalTime = localTime,
            Timezone = "Europe/Athens",
            WebUrl = webUrl,
            Title = $"{StatusLabel(status)} · {name}",
            Subtitle = string.Join(" · ", subtitleParts),
        };
    }

    private static LatestPipelineRunDto Unavailable(string message) => new()
    {
        Available = false,
        Message = message,
        Status = "unknown",
        Title = "No pipeline yet",
        Subtitle = message,
        Timezone = "Europe/Athens",
    };

    internal static string NormalizeStatus(string? status, string? result)
    {
        var s = (status ?? string.Empty).Trim().ToLowerInvariant();
        var r = (result ?? string.Empty).Trim().ToLowerInvariant();

        if (s is "inprogress" or "cancelling")
        {
            return "running";
        }

        if (s is "notstarted" or "postponed")
        {
            return "queued";
        }

        if (s == "completed")
        {
            return r switch
            {
                "succeeded" => "succeeded",
                "partiallysucceeded" => "partial",
                "failed" => "failed",
                "canceled" => "canceled",
                _ => "unknown",
            };
        }

        return string.IsNullOrWhiteSpace(s) ? "unknown" : s;
    }

    internal static string StatusLabel(string status) => status switch
    {
        "running" => "Running",
        "succeeded" => "Succeeded",
        "failed" => "Failed",
        "partial" => "Partial",
        "canceled" => "Canceled",
        "queued" => "Queued",
        _ => "Pipeline",
    };

    internal static string? NormalizeBranch(string? sourceBranch)
    {
        if (string.IsNullOrWhiteSpace(sourceBranch))
        {
            return null;
        }

        const string heads = "refs/heads/";
        const string tags = "refs/tags/";
        if (sourceBranch.StartsWith(heads, StringComparison.OrdinalIgnoreCase))
        {
            return sourceBranch[heads.Length..];
        }

        if (sourceBranch.StartsWith(tags, StringComparison.OrdinalIgnoreCase))
        {
            return sourceBranch[tags.Length..];
        }

        return sourceBranch;
    }

    private static string? FormatAthensTime(DateTime utc)
    {
        if (utc == DateTime.MinValue)
        {
            return null;
        }

        var tz = ResolveAthens();
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), tz);
        return local.ToString("HH:mm");
    }

    private static TimeZoneInfo ResolveAthens()
    {
        if (TimeZoneInfo.TryFindSystemTimeZoneById("Europe/Athens", out var iana))
        {
            return iana;
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("GTB Standard Time");
        }
        catch
        {
            return TimeZoneInfo.Utc;
        }
    }

    private static string Truncate(string body) =>
        body.Length <= 240 ? body : body[..240];

    private sealed class AdoListResponse<T>
    {
        [JsonPropertyName("value")]
        public List<T>? Value { get; set; }
    }

    private sealed class AdoProject
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    private sealed class AdoBuild
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("buildNumber")]
        public string? BuildNumber { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("result")]
        public string? Result { get; set; }

        [JsonPropertyName("sourceBranch")]
        public string? SourceBranch { get; set; }

        [JsonPropertyName("queueTime")]
        public DateTime? QueueTime { get; set; }

        [JsonPropertyName("startTime")]
        public DateTime? StartTime { get; set; }

        [JsonPropertyName("finishTime")]
        public DateTime? FinishTime { get; set; }

        [JsonPropertyName("definition")]
        public AdoDefinition? Definition { get; set; }

        [JsonPropertyName("project")]
        public AdoProjectRef? Project { get; set; }

        [JsonPropertyName("_links")]
        public AdoLinks? Links { get; set; }

        [JsonIgnore]
        public string? ProjectName { get; set; }

        public DateTime SortTime()
        {
            if (FinishTime.HasValue) return FinishTime.Value.ToUniversalTime();
            if (StartTime.HasValue) return StartTime.Value.ToUniversalTime();
            if (QueueTime.HasValue) return QueueTime.Value.ToUniversalTime();
            return DateTime.MinValue;
        }
    }

    private sealed class AdoDefinition
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }

    private sealed class AdoProjectRef
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }

    private sealed class AdoLinks
    {
        [JsonPropertyName("web")]
        public AdoLink? Web { get; set; }
    }

    private sealed class AdoLink
    {
        [JsonPropertyName("href")]
        public string? Href { get; set; }
    }
}
