using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using POS.Application.Configuration;

namespace POS.Application.Services.Day;

/// <summary>
/// Triggers Botsystem anchor.day-start pipeline (fire-and-forget).
/// </summary>
public class BotSystemDayStartClient
{
    private readonly HttpClient _httpClient;
    private readonly BotSystemOptions _options;
    private readonly UserDayClock _dayClock;
    private readonly ILogger<BotSystemDayStartClient> _logger;

    public BotSystemDayStartClient(
        HttpClient httpClient,
        IOptions<BotSystemOptions> options,
        UserDayClock dayClock,
        ILogger<BotSystemDayStartClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _dayClock = dayClock;
        _logger = logger;
    }

    public async Task TryRunDayStartAsync(string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.BaseUrl))
        {
            _logger.LogWarning("BotSystem BaseUrl not configured; skipping day-start for user {UserId}", userId);
            return;
        }

        var today = await _dayClock.GetTodayAsync(userId, ct);
        var yesterday = await _dayClock.GetYesterdayAsync(userId, ct);
        var botKey = string.IsNullOrWhiteSpace(_options.DayStartBotKey)
            ? "anchor.day-start"
            : _options.DayStartBotKey;

        var url = $"{_options.BaseUrl.TrimEnd('/')}/api/bots/{botKey}/run";
        var payload = new
        {
            inputs = new
            {
                userId,
                today = today.ToString("yyyy-MM-dd"),
                yesterday = yesterday.ToString("yyyy-MM-dd")
            }
        };

        try
        {
            using var response = await _httpClient.PostAsJsonAsync(url, payload, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Day-start bot {BotKey} completed for user {UserId}", botKey, userId);
                return;
            }

            _logger.LogWarning(
                "Day-start bot {BotKey} failed for user {UserId}: {Status} {Body}",
                botKey, userId, (int)response.StatusCode, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to run day-start bot for user {UserId}", userId);
        }
    }
}
