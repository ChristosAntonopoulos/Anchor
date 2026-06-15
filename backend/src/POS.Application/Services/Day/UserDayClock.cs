using MongoDB.Driver;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Day;

/// <summary>
/// Resolves calendar "today" / "yesterday" in the user's timezone (falls back to UTC).
/// </summary>
public class UserDayClock
{
    private readonly MongoDbContext _context;

    public UserDayClock(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<DateTime> GetTodayAsync(string userId, CancellationToken ct = default)
    {
        var tz = await GetTimeZoneAsync(userId, ct);
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
    }

    public async Task<DateTime> GetYesterdayAsync(string userId, CancellationToken ct = default)
    {
        return (await GetTodayAsync(userId, ct)).AddDays(-1);
    }

    private async Task<TimeZoneInfo> GetTimeZoneAsync(string userId, CancellationToken ct)
    {
        var user = await _context.Users
            .Find(u => u.UserId == userId)
            .FirstOrDefaultAsync(ct);

        var timeZoneId = string.IsNullOrWhiteSpace(user?.Timezone) ? "UTC" : user!.Timezone;

        if (TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId, out var tz))
            return tz;

        return TimeZoneInfo.Utc;
    }
}
