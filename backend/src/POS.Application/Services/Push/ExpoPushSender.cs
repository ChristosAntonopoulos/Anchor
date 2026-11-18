using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace POS.Application.Services.Push;

/// <summary>
/// Sends push notifications via Expo's push API (works for Expo + FCM tokens ExponentPushToken[…]).
/// </summary>
public class ExpoPushSender
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _httpClient;
    private readonly ILogger<ExpoPushSender> _logger;

    public ExpoPushSender(HttpClient httpClient, ILogger<ExpoPushSender> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ExpoPushSendResult> SendAsync(
        IReadOnlyList<string> tokens,
        string title,
        string body,
        IDictionary<string, object?>? data,
        CancellationToken cancellationToken = default)
    {
        var result = new ExpoPushSendResult();
        if (tokens.Count == 0)
        {
            return result;
        }

        var messages = tokens
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Distinct(StringComparer.Ordinal)
            .Select(token => new ExpoPushMessage
            {
                To = token,
                Title = title,
                Body = body,
                Sound = "default",
                // default = tray-friendly on Android; high forced heads-up + felt like a hostile popup
                Priority = "default",
                ChannelId = "os-assistant",
                Data = data
            })
            .ToList();

        result.TokensTargeted = messages.Count;
        if (messages.Count == 0)
        {
            return result;
        }

        try
        {
            using var response = await _httpClient.PostAsJsonAsync(
                "https://exp.host/--/api/v2/push/send",
                messages,
                JsonOptions,
                cancellationToken);

            var raw = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = $"Expo push HTTP {(int)response.StatusCode}: {Truncate(raw, 400)}";
                _logger.LogWarning(error);
                result.Errors.Add(error);
                return result;
            }

            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(raw) ? "{}" : raw);
            if (doc.RootElement.TryGetProperty("data", out var dataEl))
            {
                if (dataEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var ticket in dataEl.EnumerateArray())
                    {
                        var status = ticket.TryGetProperty("status", out var s) ? s.GetString() : null;
                        if (string.Equals(status, "ok", StringComparison.OrdinalIgnoreCase))
                        {
                            result.TicketsAccepted++;
                        }
                        else
                        {
                            var message = ticket.TryGetProperty("message", out var m) ? m.GetString() : "unknown";
                            result.Errors.Add(message ?? "Expo ticket error");
                        }
                    }
                }
                else if (dataEl.ValueKind == JsonValueKind.Object)
                {
                    var status = dataEl.TryGetProperty("status", out var s) ? s.GetString() : null;
                    if (string.Equals(status, "ok", StringComparison.OrdinalIgnoreCase))
                    {
                        result.TicketsAccepted++;
                    }
                    else
                    {
                        var message = dataEl.TryGetProperty("message", out var m) ? m.GetString() : "unknown";
                        result.Errors.Add(message ?? "Expo ticket error");
                    }
                }
            }
            else
            {
                // Some Expo responses return a bare ticket array
                result.TicketsAccepted = messages.Count;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Expo push send failed");
            result.Errors.Add(ex.Message);
        }

        return result;
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max] + "…";

    private sealed class ExpoPushMessage
    {
        public string To { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? Sound { get; set; }
        public string? Priority { get; set; }
        public string? ChannelId { get; set; }
        public IDictionary<string, object?>? Data { get; set; }
    }
}

public class ExpoPushSendResult
{
    public int TokensTargeted { get; set; }
    public int TicketsAccepted { get; set; }
    public List<string> Errors { get; set; } = new();
}
