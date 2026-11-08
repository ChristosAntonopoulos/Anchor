using MongoDB.Bson.Serialization.Attributes;

namespace POS.Core.Entities.Money;

/// <summary>
/// A card/tap payment captured from a Google Wallet notification.
/// </summary>
public class WalletSpend : DayAnchoredEntity
{
    [BsonElement("merchant")]
    public string Merchant { get; set; } = string.Empty;

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "EUR";

    [BsonElement("sourceNotificationId")]
    public string SourceNotificationId { get; set; } = string.Empty;

    [BsonElement("packageName")]
    public string PackageName { get; set; } = string.Empty;

    [BsonElement("rawText")]
    public string? RawText { get; set; }
}
