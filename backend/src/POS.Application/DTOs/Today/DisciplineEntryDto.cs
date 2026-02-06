namespace POS.Application.DTOs.Today;

/// <summary>
/// Discipline entry DTO for Today response
/// </summary>
public class DisciplineEntryDto
{
    public bool Gym { get; set; }
    public bool Walk { get; set; }
    public bool Cooked { get; set; }
    public bool Diet { get; set; }
    public bool Meditation { get; set; }
    public bool Water { get; set; }
}
