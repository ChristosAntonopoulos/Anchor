using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using POS.Application.Configuration;
using POS.Infrastructure.Data;

namespace POS.Application.Services.AIInput;

/// <summary>
/// Forwards NL intake to Botsystem anchor.intake and updates aiInputs status in MongoDB.
/// </summary>
public class BotSystemIntakeClient
{
    private readonly HttpClient _httpClient;
    private readonly BotSystemOptions _options;
    private readonly MongoDbContext _context;
    private readonly ILogger<BotSystemIntakeClient> _logger;

    public BotSystemIntakeClient(
        HttpClient httpClient,
        IOptions<BotSystemOptions> options,
        MongoDbContext context,
        ILogger<BotSystemIntakeClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _context = context;
        _logger = logger;
    }

    public async Task TryRunIntakeAsync(string aiInputId, string text, string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.BaseUrl))
        {
            _logger.LogWarning("BotSystem BaseUrl not configured; skipping intake forward for {InputId}", aiInputId);
            return;
        }

        await SetStatusAsync(aiInputId, "processing", null, null, ct);

        var url = $"{_options.BaseUrl.TrimEnd('/')}/api/bots/{_options.IntakeBotKey}/run";
        var payload = new
        {
            inputs = new
            {
                aiInputId,
                text,
                userId,
                today = DateTime.UtcNow.ToString("yyyy-MM-dd")
            }
        };

        try
        {
            using var response = await _httpClient.PostAsJsonAsync(url, payload, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                var intent = TryExtractIntent(body);
                await SetStatusAsync(aiInputId, "completed", intent, null, ct);
                _logger.LogInformation(
                    "Forwarded AI input {InputId} to Botsystem bot {BotKey}, intent={Intent}",
                    aiInputId, _options.IntakeBotKey, intent ?? "unknown");
                return;
            }

            await SetStatusAsync(aiInputId, "failed", null, $"Botsystem returned {(int)response.StatusCode}", ct);
            _logger.LogWarning(
                "Botsystem intake forward failed for {InputId}: {Status} {Body}",
                aiInputId, (int)response.StatusCode, body);
        }
        catch (Exception ex)
        {
            await SetStatusAsync(aiInputId, "failed", null, ex.Message, ct);
            _logger.LogError(ex, "Failed to forward AI input {InputId} to Botsystem", aiInputId);
        }
    }

    private static string? TryExtractIntent(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            if (!doc.RootElement.TryGetProperty("stepRuns", out var stepRuns))
                return null;

            foreach (var step in stepRuns.EnumerateArray())
            {
                if (!step.TryGetProperty("stepType", out var stepType) ||
                    stepType.GetString() != "parse.json")
                    continue;

                if (!step.TryGetProperty("outputJson", out var outputJsonProp))
                    continue;

                var outputJson = outputJsonProp.GetString();
                if (string.IsNullOrWhiteSpace(outputJson))
                    continue;

                using var output = JsonDocument.Parse(outputJson);
                if (output.RootElement.TryGetProperty("parsed", out var parsed) &&
                    parsed.TryGetProperty("intent", out var intent))
                {
                    return intent.GetString();
                }
            }
        }
        catch
        {
            // Best-effort parsing only
        }

        return null;
    }

    private async Task SetStatusAsync(
        string aiInputId,
        string status,
        string? result,
        string? error,
        CancellationToken ct)
    {
        var update = Builders<POS.Core.Entities.AIInput.AIInput>.Update
            .Set(i => i.Status, status)
            .Set(i => i.UpdatedAt, DateTime.UtcNow);

        if (status is "completed" or "failed")
            update = update.Set(i => i.ProcessedAt, DateTime.UtcNow);

        if (result != null)
            update = update.Set(i => i.Result, result);

        if (error != null)
            update = update.Set(i => i.Error, error);

        await _context.AIInputs.UpdateOneAsync(
            Builders<POS.Core.Entities.AIInput.AIInput>.Filter.Eq(i => i.Id, aiInputId),
            update,
            cancellationToken: ct);
    }
}
