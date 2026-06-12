using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.AIInput;
using POS.Core.Entities.AIInput;
using POS.Infrastructure.Data;

namespace POS.Application.Services.AIInput;

/// <summary>
/// Service for managing AI input submissions
/// </summary>
public class AIInputService
{
    private readonly MongoDbContext _context;
    private readonly BotSystemIntakeClient _botSystem;
    private readonly ILogger<AIInputService> _logger;

    public AIInputService(
        MongoDbContext context,
        BotSystemIntakeClient botSystem,
        ILogger<AIInputService> logger)
    {
        _context = context;
        _botSystem = botSystem;
        _logger = logger;
    }

    /// <summary>
    /// Submit natural language input for AI processing
    /// </summary>
    public async Task<AIInputDto> SubmitInputAsync(string text, string userId)
    {
        _logger.LogInformation("Submitting AI input for user {UserId}", userId);

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("Text cannot be empty", nameof(text));
        }

        var input = new POS.Core.Entities.AIInput.AIInput
        {
            Text = text.Trim(),
            Status = "pending",
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.AIInputs.InsertOneAsync(input);

        _logger.LogInformation("AI input {InputId} submitted successfully", input.Id);

        _ = _botSystem.TryRunIntakeAsync(input.Id, input.Text, userId, CancellationToken.None);

        return new AIInputDto
        {
            Id = input.Id,
            Text = input.Text,
            Status = input.Status,
            CreatedAt = input.CreatedAt,
            UpdatedAt = input.UpdatedAt
        };
    }

    public async Task<AIInputDto?> GetInputAsync(string inputId, string userId)
    {
        var input = await _context.AIInputs
            .Find(i => i.Id == inputId && i.UserId == userId)
            .FirstOrDefaultAsync();

        if (input == null)
            return null;

        return MapToDto(input);
    }

    private static AIInputDto MapToDto(POS.Core.Entities.AIInput.AIInput input) => new()
    {
        Id = input.Id,
        Text = input.Text,
        Status = input.Status,
        CreatedAt = input.CreatedAt,
        UpdatedAt = input.UpdatedAt,
        ProcessedAt = input.ProcessedAt,
        Result = input.Result,
        Error = input.Error
    };

    /// <summary>
    /// Get pending inputs (for debugging/monitoring)
    /// </summary>
    public async Task<List<AIInputDto>> GetPendingInputsAsync(string userId)
    {
        _logger.LogInformation("Getting pending AI inputs for user {UserId}", userId);

        var filter = Builders<POS.Core.Entities.AIInput.AIInput>.Filter.And(
            Builders<POS.Core.Entities.AIInput.AIInput>.Filter.Eq(i => i.UserId, userId),
            Builders<POS.Core.Entities.AIInput.AIInput>.Filter.Eq(i => i.Status, "pending")
        );

        var inputs = await _context.AIInputs.Find(filter).ToListAsync();

        return inputs.Select(MapToDto).ToList();
    }
}
