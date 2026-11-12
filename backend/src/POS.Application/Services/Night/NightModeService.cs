using System.Text.Json;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Execution;
using POS.Application.DTOs.Night;
using POS.Application.Services.Execution;
using POS.Core.Entities.Night;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Night;

public class NightModeService
{
    private readonly MongoDbContext _context;
    private readonly ExecutionService _execution;
    private readonly ILanguageModelClient _llm;
    private readonly ILogger<NightModeService> _logger;

    public NightModeService(
        MongoDbContext context,
        ExecutionService execution,
        ILanguageModelClient llm,
        ILogger<NightModeService> logger)
    {
        _context = context;
        _execution = execution;
        _llm = llm;
        _logger = logger;
    }

    public async Task UpsertSessionAsync(string userId, JsonElement payload, CancellationToken ct = default)
    {
        var localDate = payload.TryGetProperty("localDate", out var dateEl) ? dateEl.GetString() ?? "" : "";
        var status = payload.TryGetProperty("status", out var statusEl) ? statusEl.GetString() ?? "" : "";
        var timezone = payload.TryGetProperty("timezone", out var tzEl) ? tzEl.GetString() ?? "" : "";
        if (string.IsNullOrWhiteSpace(localDate))
        {
            return;
        }

        var filter = Builders<NightModeSession>.Filter.And(
            Builders<NightModeSession>.Filter.Eq(x => x.UserId, userId),
            Builders<NightModeSession>.Filter.Eq(x => x.LocalDate, localDate)
        );
        var existing = await _context.NightModeSessions.Find(filter).FirstOrDefaultAsync(ct);
        var json = payload.GetRawText();
        if (existing == null)
        {
            await _context.NightModeSessions.InsertOneAsync(new NightModeSession
            {
                UserId = userId,
                LocalDate = localDate,
                Timezone = timezone,
                Status = status,
                PayloadJson = json,
            }, cancellationToken: ct);
            return;
        }

        existing.Timezone = timezone;
        existing.Status = status;
        existing.PayloadJson = json;
        existing.UpdatedAt = DateTime.UtcNow;
        await _context.NightModeSessions.ReplaceOneAsync(filter, existing, cancellationToken: ct);
    }

    public async Task<NightTomorrowPlanDto> TomorrowPlanAsync(string userId, CancellationToken ct = default)
    {
        NowRecommendationDto now;
        try
        {
            now = await _execution.GetNowAsync(userId, new NowRequest { Capacity = "5", EasierStart = true }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Night tomorrow-plan fallback");
            now = new NowRecommendationDto();
        }

        var title = string.IsNullOrWhiteSpace(now.TaskTitle) ? "First step for tomorrow" : now.TaskTitle;
        var first = string.IsNullOrWhiteSpace(now.NextAction)
            ? "Write one small first step for tomorrow."
            : $"For tomorrow: {Physicalize(now.NextAction)}";
        return new NightTomorrowPlanDto
        {
            TaskId = now.TaskId,
            TaskTitle = title,
            Reason = string.IsNullOrWhiteSpace(now.Reason) ? "Close the loop with one small, concrete step." : now.Reason,
            FirstPhysicalAction = first,
            NextMicroActions = new List<string>
            {
                "Put the phone on charge away from the bed.",
                "Pick just one thing for tomorrow morning.",
            },
            EasierAlternative = now.AlternativeTitle is { Length: > 0 }
                ? $"Write only: {now.AlternativeTitle}."
                : "Write only one word for tomorrow. Nothing else.",
        };
    }

    public async Task<NightHelpDto> HelpAsync(string userId, NightHelpRequest request, CancellationToken ct = default)
    {
        var fallback = request.Step switch
        {
            "screens" => "Close just one screen. Leave the rest.",
            "prepare" => "Do only one thing: cool the room, wash up, or make the bed.",
            "settle" => "You do not need to do it right. Stay quiet.",
            "close" => "Write one small step. Then put the phone away.",
            _ => "Dim one light. Warm light is enough.",
        };

        if (!_llm.IsConfigured || string.IsNullOrWhiteSpace(request.Text))
        {
            return new NightHelpDto { Text = fallback };
        }

        try
        {
            var json = await _llm.CompleteJsonAsync(
                "You help one adult wind down for a quiet 30-minute indoor night routine. Reply JSON {\"text\":\"...\"}. Maximum two short English sentences. Practical sleep hygiene only: dim light, screens away, cool room, quiet breath, one tomorrow step. No medical advice. No pep talk.",
                "The user is stuck during a night wind-down step. Make the next action smaller.",
                JsonSerializer.Serialize(new { request.Step, request.Text, userId }),
                ct);
            if (!string.IsNullOrWhiteSpace(json))
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("text", out var text) && text.GetString() is { Length: > 0 } value)
                {
                    return new NightHelpDto { Text = TrimHelp(value) };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Night help model failed");
        }

        return new NightHelpDto { Text = fallback };
    }

    private static string Physicalize(string action)
    {
        if (action.Contains("write", StringComparison.OrdinalIgnoreCase) || action.Contains("Cursor", StringComparison.OrdinalIgnoreCase))
        {
            return action;
        }
        return $"Note: {action}".Trim();
    }

    private static string TrimHelp(string value)
    {
        var parts = value.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length <= 2) return value.Trim();
        return string.Join(". ", parts.Take(2)) + ".";
    }
}
