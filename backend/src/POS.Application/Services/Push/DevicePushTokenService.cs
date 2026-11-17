using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Devices;
using POS.Core.Entities.Devices;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Push;

public class DevicePushTokenService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<DevicePushTokenService> _logger;

    public DevicePushTokenService(MongoDbContext context, ILogger<DevicePushTokenService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DevicePushTokenDto> RegisterAsync(RegisterPushTokenRequest request, string userId)
    {
        var token = request.Token.Trim();
        var platform = string.IsNullOrWhiteSpace(request.Platform)
            ? "android"
            : request.Platform.Trim().ToLowerInvariant();
        var tokenFingerprint = Fingerprint(token);

        _logger.LogInformation(
            "Registering push token for user {UserId} platform {Platform} fingerprint {Fingerprint} expoProjectId {ExpoProjectId}",
            userId,
            platform,
            tokenFingerprint,
            request.ExpoProjectId ?? "(none)");

        var filter = Builders<DevicePushToken>.Filter.And(
            Builders<DevicePushToken>.Filter.Eq(t => t.UserId, userId),
            Builders<DevicePushToken>.Filter.Eq(t => t.Token, token));

        var existing = await _context.DevicePushTokens.Find(filter).FirstOrDefaultAsync();
        if (existing != null)
        {
            existing.Platform = platform;
            existing.ExpoProjectId = request.ExpoProjectId;
            existing.LastSeenAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.DevicePushTokens.ReplaceOneAsync(filter, existing);
            _logger.LogInformation(
                "Updated existing push token for user {UserId} fingerprint {Fingerprint} lastSeenAt {LastSeenAt:o}",
                userId,
                tokenFingerprint,
                existing.LastSeenAt);
            return ToDto(existing);
        }

        var entity = new DevicePushToken
        {
            UserId = userId,
            Token = token,
            Platform = platform,
            ExpoProjectId = request.ExpoProjectId,
            LastSeenAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _context.DevicePushTokens.InsertOneAsync(entity);
        _logger.LogInformation(
            "Inserted new push token for user {UserId} fingerprint {Fingerprint} id {Id}",
            userId,
            tokenFingerprint,
            entity.Id);
        return ToDto(entity);
    }

    public async Task<PushTokenRegistrationStatusDto> GetRegistrationStatusAsync(string userId)
    {
        var devices = await ListForUserAsync(userId);
        var last = devices
            .Select(d => d.LastSeenAt)
            .DefaultIfEmpty()
            .Max();

        var status = new PushTokenRegistrationStatusDto
        {
            UserId = userId,
            TokenCount = devices.Count,
            LastRegisteredAt = devices.Count == 0 ? null : last,
            Platforms = devices
                .Select(d => d.Platform)
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
                .ToList()
        };

        _logger.LogInformation(
            "Push registration status for user {UserId}: tokenCount={TokenCount} lastRegisteredAt={LastRegisteredAt} platforms={Platforms}",
            userId,
            status.TokenCount,
            status.LastRegisteredAt?.ToString("o") ?? "(none)",
            string.Join(',', status.Platforms));

        return status;
    }

    public async Task<List<DevicePushToken>> ListForUserAsync(string userId)
    {
        return await _context.DevicePushTokens
            .Find(Builders<DevicePushToken>.Filter.Eq(t => t.UserId, userId))
            .ToListAsync();
    }

    public async Task RemoveTokenAsync(string userId, string token)
    {
        await _context.DevicePushTokens.DeleteOneAsync(
            Builders<DevicePushToken>.Filter.And(
                Builders<DevicePushToken>.Filter.Eq(t => t.UserId, userId),
                Builders<DevicePushToken>.Filter.Eq(t => t.Token, token)));
        _logger.LogInformation(
            "Removed push token for user {UserId} fingerprint {Fingerprint}",
            userId,
            Fingerprint(token));
    }

    /// <summary>Removes every stored token for the user (e.g. clear probe / stale registrations).</summary>
    public async Task<long> ClearAllForUserAsync(string userId)
    {
        var result = await _context.DevicePushTokens.DeleteManyAsync(
            Builders<DevicePushToken>.Filter.Eq(t => t.UserId, userId));
        _logger.LogInformation(
            "Cleared {Count} push token(s) for user {UserId}",
            result.DeletedCount,
            userId);
        return result.DeletedCount;
    }

    private static DevicePushTokenDto ToDto(DevicePushToken entity) => new()
    {
        Id = entity.Id,
        Token = entity.Token,
        Platform = entity.Platform,
        LastSeenAt = entity.LastSeenAt
    };

    /// <summary>Short non-reversible-ish label for logs — never the raw token.</summary>
    private static string Fingerprint(string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return "(empty)";
        }

        var prefix = token.Length <= 18 ? token : token[..18];
        return $"{prefix}…len={token.Length}";
    }
}
