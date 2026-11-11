namespace POS.Core.Entities.Discipline;

/// <summary>
/// Daily drinks target for one adult man in a warm climate: 2.5 L from fluids.
/// EFSA Adequacy for men is 2.5 L total water (about 2.0 L from drinks); food covers the rest.
/// Extra glasses cover training and heat. A gallon (3.8 L) is a 75 Hard stunt, not a health target.
/// </summary>
public static class HydrationDefaults
{
    public const string ItemId = "WaterGlasses";
    public const string LegacyItemId = "GallonWater";
    public const string ItemName = "Water · 10 × 250 ml (2.5 L)";
    public const int TargetGlasses = 10;

    public static DisciplineItem CreateItem(int glasses = 0) => new()
    {
        ItemId = ItemId,
        ItemName = ItemName,
        Type = DisciplineItemType.Counter,
        CounterValue = Math.Max(0, glasses)
    };

    public static bool Normalize(DisciplineEntry entry)
    {
        if (entry.Blocks == null || entry.Blocks.Count == 0)
        {
            return false;
        }

        var changed = false;
        var found = false;
        foreach (var block in entry.Blocks)
        {
            for (var i = 0; i < block.Items.Count; i++)
            {
                var item = block.Items[i];
                if (item.ItemId != ItemId && item.ItemId != LegacyItemId)
                {
                    continue;
                }

                found = true;
                var glasses = item.Type == DisciplineItemType.Toggle
                    ? (item.ToggleValue == true ? TargetGlasses : 0)
                    : item.CounterValue ?? 0;
                var next = CreateItem(glasses);
                if (item.ItemId != next.ItemId ||
                    item.ItemName != next.ItemName ||
                    item.Type != next.Type ||
                    item.CounterValue != next.CounterValue ||
                    item.ToggleValue != null)
                {
                    block.Items[i] = next;
                    changed = true;
                }
            }
        }

        if (!found)
        {
            var hard = entry.Blocks.FirstOrDefault(b => b.BlockId == "75Hard") ?? entry.Blocks[0];
            hard.Items.Add(CreateItem());
            changed = true;
        }

        return changed;
    }
}
