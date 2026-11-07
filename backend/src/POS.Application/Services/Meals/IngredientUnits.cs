using POS.Application.DTOs.Meals;
using POS.Core.Entities.Meals;

namespace POS.Application.Services.Meals;

/// <summary>
/// Normalizes cooking units so pantry ml can cover recipe tbsp, etc.
/// </summary>
public static class IngredientUnits
{
    public enum Family
    {
        Mass,
        Volume,
        Count,
        Other
    }

    public static string Normalize(string? unit)
    {
        if (string.IsNullOrWhiteSpace(unit))
            return "unit";

        var u = unit.Trim().ToLowerInvariant();
        return u switch
        {
            "tablespoon" or "tablespoons" or "tbsp." or "κ.σ." or "κσ" or "κ.σ" => "tbsp",
            "teaspoon" or "teaspoons" or "tsp." or "κ.γ." or "κγ" or "κ.γ" => "tsp",
            "milliliter" or "milliliters" or "millilitre" or "mls" => "ml",
            "liter" or "litre" or "liters" or "litres" or "lt" => "l",
            "gram" or "grams" or "gr" => "g",
            "kilogram" or "kilograms" or "kgs" => "kg",
            "piece" or "pieces" or "pc" or "τεμ" or "τεμάχιο" or "τεμάχια" => "pcs",
            "cup" or "cups" or "φλιτζ" => "cup",
            "item" or "items" => "item",
            _ => u
        };
    }

    public static Family GetFamily(string? unit) =>
        Normalize(unit) switch
        {
            "g" or "kg" => Family.Mass,
            "ml" or "l" or "tsp" or "tbsp" or "cup" => Family.Volume,
            "pcs" => Family.Count,
            _ => Family.Other
        };

    public static decimal ToBase(decimal amount, string? unit) =>
        Normalize(unit) switch
        {
            "kg" => amount * 1000m,
            "g" => amount,
            "l" => amount * 1000m,
            "ml" => amount,
            "tsp" => amount * 5m,
            "tbsp" => amount * 15m,
            "cup" => amount * 240m,
            _ => amount
        };

    public static decimal FromBase(decimal baseAmount, string? unit) =>
        Normalize(unit) switch
        {
            "kg" => baseAmount / 1000m,
            "g" => baseAmount,
            "l" => baseAmount / 1000m,
            "ml" => baseAmount,
            "tsp" => baseAmount / 5m,
            "tbsp" => baseAmount / 15m,
            "cup" => baseAmount / 240m,
            _ => baseAmount
        };

    public static bool TryConvert(decimal amount, string? fromUnit, string? toUnit, out decimal converted)
    {
        var from = Normalize(fromUnit);
        var to = Normalize(toUnit);
        if (from == to)
        {
            converted = amount;
            return true;
        }

        if (GetFamily(from) == GetFamily(to) && GetFamily(from) != Family.Other)
        {
            converted = FromBase(ToBase(amount, from), to);
            return true;
        }

        converted = 0;
        return false;
    }

    public static decimal AvailableIn(IEnumerable<InventoryBatchDto> inventory, string rawName, string? unit)
    {
        decimal total = 0;
        foreach (var batch in inventory.Where(b => NamesMatch(b.RawName, rawName)))
        {
            if (TryConvert(batch.CurrentAmount, batch.Unit, unit, out var converted))
                total += converted;
        }

        return total;
    }

    public static bool NamesMatch(string? a, string? b) =>
        string.Equals(a?.Trim(), b?.Trim(), StringComparison.OrdinalIgnoreCase);

    public static decimal QuantityToBuy(decimal toBuy)
    {
        if (toBuy <= 0)
            return 0;
        if (toBuy < 1)
            return Math.Max(0.01m, Math.Round(toBuy, 2, MidpointRounding.AwayFromZero));
        if (toBuy < 10)
            return Math.Round(toBuy, 1, MidpointRounding.AwayFromZero);
        return Math.Round(toBuy, 0, MidpointRounding.AwayFromZero);
    }

    public static string StorageLocationFor(string rawName)
    {
        var n = rawName.ToLowerInvariant();
        string[] cupboard =
        [
            "μακαρόν", "spaghetti", "pasta", "penne", "noodles",
            "ρύζι", "rice", "φακ", "lentil",
            "αλάτι", "salt", "ζάχαρ", "sugar", "αλεύρ", "flour",
            "ελαιόλαδ", "olive", "λάδι", "oil",
            "μέλι", "honey", "δάφνη", "ρίγαν", "βασιλικ", "oregano",
            "πιπέρι", "pepper", "κύμινο", "κανέλ"
        ];
        return cupboard.Any(p => n.Contains(p, StringComparison.Ordinal)) ? "Cupboard" : "Fridge";
    }

    public static (List<string> Missing, List<string> Uncertain) DiffIngredients(
        IEnumerable<RecipeIngredient> ingredients,
        IReadOnlyList<InventoryBatchDto> inventory,
        decimal scaleFactor)
    {
        var missing = new List<string>();
        var uncertain = new List<string>();

        foreach (var ingredient in ingredients.Where(i => !i.IsOptional && !string.IsNullOrWhiteSpace(i.RawName)))
        {
            var needed = (ingredient.Amount ?? 1m) * (scaleFactor <= 0 ? 1m : scaleFactor);
            var unit = ingredient.Unit ?? "unit";
            var batches = inventory.Where(b => NamesMatch(b.RawName, ingredient.RawName)).ToList();
            var available = AvailableIn(batches, ingredient.RawName, unit);
            if (available + 0.001m < needed)
            {
                missing.Add(ingredient.RawName);
                continue;
            }

            var exact = AvailableIn(batches.Where(b => !b.AmountIsApproximate), ingredient.RawName, unit);
            if (exact + 0.001m < needed)
                uncertain.Add(ingredient.RawName);
        }

        return (missing, uncertain);
    }
}
