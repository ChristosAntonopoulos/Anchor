namespace POS.Application.DTOs.Tasks;

/// <summary>
/// Location DTO
/// </summary>
public class LocationDto
{
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Address { get; set; }
    public string? PlaceName { get; set; }
}
