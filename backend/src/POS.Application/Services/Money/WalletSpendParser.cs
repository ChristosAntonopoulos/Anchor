using System.Globalization;
using System.Text.RegularExpressions;
using POS.Core.Entities.Notifications;

namespace POS.Application.Services.Money;

public sealed record ParsedWalletSpend(
    string Date,
    string Merchant,
    decimal Amount,
    string Currency,
    string SourceNotificationId,
    string PackageName,
    string RawText);

public static class WalletSpendParser
{
    private static readonly string[] WalletPackages =
    [
        "com.google.android.apps.walletnfcrel",
        "com.google.android.apps.nbu.paisa.user",
        "com.google.android.apps.walleted"
    ];

    private static readonly string[] PackageHints = ["walletnfcrel", "nbu.paisa", "tapandpay", "walleted"];

    private static readonly string[] GenericTitles =
    [
        "paid", "payment", "payment successful", "google wallet", "google pay", "gpay",
        "you paid", "paid with google pay", "paid with google wallet", "tap to pay", "wallet",
        "πληρωμή", "πληρώσατε"
    ];

    private static readonly string[] PassHints =
    [
        "boarding pass", "loyalty", "added to wallet", "ticket is ready",
        "pass is ready", "expires", "event ticket", "gift card"
    ];

    public static bool IsGoogleWalletNotification(string? packageName, string? appName, string? title, string? channelName)
    {
        var pkg = (packageName ?? string.Empty).ToLowerInvariant();
        if (WalletPackages.Contains(pkg))
        {
            return true;
        }

        if (PackageHints.Any(hint => pkg.Contains(hint)))
        {
            return true;
        }

        if (pkg is "com.google.android.gms" or "com.google.android.gsf")
        {
            var blob = $"{appName} {title} {channelName}".ToLowerInvariant();
            return blob.Contains("wallet") || blob.Contains("google pay") || blob.Contains("gpay") || blob.Contains("tapandpay") || blob.Contains("tap and pay");
        }

        return false;
    }

    public static string SourceId(string packageName, string notificationId, DateTime postTime)
    {
        var utc = postTime.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(postTime, DateTimeKind.Utc)
            : postTime.ToUniversalTime();
        var ms = new DateTimeOffset(utc).ToUnixTimeMilliseconds();
        return $"{packageName}:{notificationId}:{ms}";
    }

    public static ParsedWalletSpend? TryParse(Notification notification)
    {
        if (!IsGoogleWalletNotification(notification.PackageName, notification.AppName, notification.Title, notification.ChannelName))
        {
            return null;
        }

        var raw = string.Join(" ", new[] { notification.Title, notification.Text, notification.SubText, notification.LargeText }
            .Where(part => !string.IsNullOrWhiteSpace(part)))
            .Trim();
        raw = Regex.Replace(raw, @"\s+", " ");
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var lower = raw.ToLowerInvariant();
        var money = ExtractAmount(raw);
        if (PassHints.Any(hint => lower.Contains(hint)) && money == null)
        {
            return null;
        }

        if (money == null)
        {
            return null;
        }

        return new ParsedWalletSpend(
            notification.PostTime.ToUniversalTime().ToString("yyyy-MM-dd"),
            ExtractMerchant(notification.Title, raw),
            money.Value.Amount,
            money.Value.Currency,
            SourceId(notification.PackageName, notification.NotificationId, notification.PostTime),
            notification.PackageName,
            raw.Length > 400 ? raw[..400] : raw);
    }

    private static (decimal Amount, string Currency)? ExtractAmount(string text)
    {
        var patterns = new (string Pattern, string Currency)[]
        {
            (@"(?:€|eur)\s*(\d{1,6}(?:[.,]\d{2})?)", "EUR"),
            (@"(\d{1,6}(?:[.,]\d{2})?)\s*(?:€|eur)", "EUR"),
            (@"(?:£|gbp)\s*(\d{1,6}(?:[.,]\d{2})?)", "GBP"),
            (@"(\d{1,6}(?:[.,]\d{2})?)\s*(?:£|gbp)", "GBP"),
            (@"(?:\$|usd)\s*(\d{1,6}(?:[.,]\d{2})?)", "USD"),
            (@"(\d{1,6}(?:[.,]\d{2})?)\s*(?:\$|usd)", "USD"),
        };

        foreach (var (pattern, currency) in patterns)
        {
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
            if (!match.Success)
            {
                continue;
            }

            var amount = ParseLocaleAmount(match.Groups[1].Value);
            if (amount is > 0)
            {
                return (amount.Value, currency);
            }
        }

        return null;
    }

    private static decimal? ParseLocaleAmount(string raw)
    {
        var normalized = raw.Contains(',') && !raw.Contains('.')
            ? raw.Replace(',', '.')
            : raw.Replace(",", "");
        return decimal.TryParse(normalized, NumberStyles.Number, CultureInfo.InvariantCulture, out var value)
            ? Math.Round(value, 2)
            : null;
    }

    private static string ExtractMerchant(string? title, string raw)
    {
        var at = Regex.Match(
            raw,
            @"(?:\b(?:at|to|from)\b|(?:^|\s)(?:στο|σε|στον|στην))\s+(.+)$",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        if (at.Success)
        {
            var merchant = CleanMerchant(at.Groups[1].Value);
            if (!string.IsNullOrWhiteSpace(merchant))
            {
                return merchant;
            }
        }

        var cleanedTitle = CleanMerchant(title ?? "");
        if (!string.IsNullOrWhiteSpace(cleanedTitle) && !GenericTitles.Contains(cleanedTitle.ToLowerInvariant()))
        {
            return cleanedTitle;
        }

        return "Google Wallet";
    }

    private static string CleanMerchant(string value) =>
        Regex.Replace(value, @"\s+", " ")
            .Replace("·", " ")
            .Trim()
            .TrimEnd('.', '!', '?');
}
