using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using POS.Application.Configuration;

namespace POS.Application.Services.Execution;

public class OpenAiCompatibleClient : ILanguageModelClient
{
    private readonly HttpClient _http;
    private readonly OpenAiOptions _options;
    private readonly ILogger<OpenAiCompatibleClient> _logger;

    public OpenAiCompatibleClient(
        HttpClient http,
        IOptions<OpenAiOptions> options,
        ILogger<OpenAiCompatibleClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
        _http.Timeout = TimeSpan.FromSeconds(Math.Clamp(_options.TimeoutSeconds, 10, 90));
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ResolveApiKey());

    public string ModelName => string.IsNullOrWhiteSpace(_options.Model) ? "gpt-4o" : _options.Model;

    public async Task<string?> CompleteJsonAsync(
        string systemPrompt,
        string capabilityPrompt,
        string contextJson,
        CancellationToken ct = default)
    {
        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return null;
        }

        var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl)
            ? "https://api.openai.com/v1"
            : _options.BaseUrl.TrimEnd('/');
        var url = $"{baseUrl}/chat/completions";

        var payload = new
        {
            model = ModelName,
            temperature = 0.3,
            max_tokens = _options.MaxTokens,
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = capabilityPrompt + "\n\nCONTEXT:\n" + contextJson },
            },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        try
        {
            using var response = await _http.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Language model returned {Status}: {Body}", (int)response.StatusCode, Truncate(body));
                return null;
            }

            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("choices", out var choices) &&
                choices.GetArrayLength() > 0)
            {
                var message = choices[0].GetProperty("message");
                if (message.TryGetProperty("content", out var content))
                {
                    return content.GetString();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Language model call failed");
        }

        return null;
    }

    private string? ResolveApiKey()
    {
        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            return _options.ApiKey;
        }

        return Environment.GetEnvironmentVariable("OPENAI_API_KEY")
            ?? Environment.GetEnvironmentVariable("OpenAI__ApiKey");
    }

    private static string Truncate(string value) =>
        value.Length <= 400 ? value : value[..400];
}
