using AutoMapper;
using POS.Application.DTOs.Diet;
using POS.Core.Entities.Diet;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Diet entities
/// </summary>
public class DietMappingProfile : Profile
{
    public DietMappingProfile()
    {
        CreateMap<DietEntry, DietEntryDto>();
        CreateMap<DietEntryDto, DietEntry>();
    }
}
