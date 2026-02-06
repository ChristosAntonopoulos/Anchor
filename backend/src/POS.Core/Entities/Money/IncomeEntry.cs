using MongoDB.Bson.Serialization.Attributes;
using POS.Core.Entities;

namespace POS.Core.Entities.Money;

/// <summary>
/// Income entry - income event
/// </summary>
public class IncomeEntry : DayAnchoredEntity
{
    [BsonElement("source")]
    public string Source { get; set; } = string.Empty;

    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "EUR";
}
