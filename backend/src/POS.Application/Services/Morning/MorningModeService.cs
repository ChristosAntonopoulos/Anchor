using System.Text.Json;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Execution;
using POS.Application.DTOs.Morning;
using POS.Application.Services.Execution;
using POS.Core.Entities.Morning;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Morning;

public class MorningModeService
{
    private readonly MongoDbContext _context;
    private readonly ExecutionService _execution;
    private readonly ILanguageModelClient _llm;
    private readonly ILogger<MorningModeService> _logger;

    public MorningModeService(
        MongoDbContext context,
        ExecutionService execution,
        ILanguageModelClient llm,
        ILogger<MorningModeService> logger)
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

        var filter = Builders<MorningModeSession>.Filter.And(
            Builders<MorningModeSession>.Filter.Eq(x => x.UserId, userId),
            Builders<MorningModeSession>.Filter.Eq(x => x.LocalDate, localDate)
        );
        var existing = await _context.MorningModeSessions.Find(filter).FirstOrDefaultAsync(ct);
        var json = payload.GetRawText();
        if (existing == null)
        {
            await _context.MorningModeSessions.InsertOneAsync(new MorningModeSession
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
        await _context.MorningModeSessions.ReplaceOneAsync(filter, existing, cancellationToken: ct);
    }

    public async Task<MorningFirstTaskDto> FirstTaskAsync(string userId, CancellationToken ct = default)
    {
        NowRecommendationDto now;
        try
        {
            now = await _execution.GetNowAsync(userId, new NowRequest { Capacity = "5", EasierStart = true }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Morning first-task fallback");
            now = new NowRecommendationDto();
        }

        var title = string.IsNullOrWhiteSpace(now.TaskTitle) ? "Πρώτο έργο της ημέρας" : now.TaskTitle;
        var first = string.IsNullOrWhiteSpace(now.NextAction) ? "Άνοιξε το Cursor." : Physicalize(now.NextAction);
        return new MorningFirstTaskDto
        {
            TaskId = now.TaskId,
            TaskTitle = title,
            Reason = string.IsNullOrWhiteSpace(now.Reason) ? "Ξεκίνα με κάτι μικρό που ήδη ξέρεις." : now.Reason,
            FirstPhysicalAction = first,
            NextMicroActions = new List<string>
            {
                "Άνοιξε το project.",
                "Διάλεξε το πρώτο μικρό πράγμα που θα κάνεις.",
            },
            EasierAlternative = now.AlternativeTitle is { Length: > 0 }
                ? $"Άνοιξε μόνο: {now.AlternativeTitle}."
                : "Άνοιξε μόνο το Cursor. Τίποτα άλλο.",
        };
    }

    public async Task<MorningHelpDto> HelpAsync(string userId, MorningHelpRequest request, CancellationToken ct = default)
    {
        var fallback = request.Step switch
        {
            "move" => "Κάνε μόνο ό,τι είναι άνετο. Κάθισε αν χρειάζεται.",
            "clean" => "Βάλε μόνο ένα πράγμα στη θέση του.",
            "meditate" => "Δεν χρειάζεται να κάνεις κάτι σωστά. Κάθισε.",
            "task" => "Κάνε μόνο την πρώτη φυσική κίνηση. Όχι σχέδιο.",
            _ => "Άνοιξε τις κουρτίνες. Ένα ποτήρι νερό είναι αρκετό.",
        };

        if (!_llm.IsConfigured || string.IsNullOrWhiteSpace(request.Text))
        {
            return new MorningHelpDto { Text = fallback };
        }

        try
        {
            var json = await _llm.CompleteJsonAsync(
                "You help one adult start a quiet 30-minute indoor morning. Reply JSON {\"text\":\"...\"}. Maximum two short Greek sentences. Reduce difficulty. No pep talk.",
                "The user is stuck during a morning step. Make the next action smaller.",
                JsonSerializer.Serialize(new { request.Step, request.Text, userId }),
                ct);
            if (!string.IsNullOrWhiteSpace(json))
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("text", out var text) && text.GetString() is { Length: > 0 } value)
                {
                    return new MorningHelpDto { Text = TrimHelp(value) };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Morning help model failed");
        }

        return new MorningHelpDto { Text = fallback };
    }

    private static string Physicalize(string action)
    {
        if (action.Contains("Cursor", StringComparison.OrdinalIgnoreCase) || action.Contains("άνοιξε", StringComparison.OrdinalIgnoreCase))
        {
            return action;
        }
        return $"Άνοιξε το Cursor. {action}".Trim();
    }

    private static string TrimHelp(string value)
    {
        var parts = value.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length <= 2) return value.Trim();
        return string.Join(". ", parts.Take(2)) + ".";
    }
}
