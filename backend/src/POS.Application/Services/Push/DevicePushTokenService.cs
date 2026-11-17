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

        _logger.LogInformation("Registering push token for user {UserId} platform {Platform}", userId, platform);

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
        return ToDto(entity);
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
    }

    private static DevicePushTokenDto ToDto(DevicePushToken entity) => new()
    {
        Id = entity.Id,
        Token = entity.Token,
        Platform = entity.Platform,
        LastSeenAt = entity.LastSeenAt
    };
}
