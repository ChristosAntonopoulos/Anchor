namespace POS.Application.DTOs.Discipline;

/// <summary>
/// Update discipline request - for updating items by block/item ID
/// </summary>
public class UpdateDisciplineRequest
{
    public string? BlockId { get; set; }
    public string? ItemId { get; set; }
    public bool? ToggleValue { get; set; }
    public int? CounterValue { get; set; }
    public string? Note { get; set; }
}
