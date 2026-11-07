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

    public async Task<TimeZoneInfo> GetTimeZoneInfoAsync(string userId, CancellationToken ct = default) =>
        await GetTimeZoneAsync(userId, ct);

    public static DateTime StartOfWeekMonday(DateTime today)
    {
        var diff = ((int)today.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return today.Date.AddDays(-diff);
    }

    private async Task<TimeZoneInfo> GetTimeZoneAsync(string userId, CancellationToken ct)
    {
        var user = await _context.Users
            .Find(u => u.UserId == userId)
            .FirstOrDefaultAsync(ct);

        var timeZoneId = user?.Timezone;
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            var profile = await _context.FoodProfiles
                .Find(p => p.UserId == userId)
                .FirstOrDefaultAsync(ct);
            timeZoneId = profile?.Timezone;
        }

        if (string.IsNullOrWhiteSpace(timeZoneId))
            timeZoneId = "Europe/Athens";

        if (TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId, out var tz))
            return tz;

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Europe/Athens");
        }
        catch
        {
            return TimeZoneInfo.Utc;
        }
    }
}
