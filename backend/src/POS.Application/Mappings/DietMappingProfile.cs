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
        // DietEntry mappings
        CreateMap<DietEntry, DietEntryDto>()
            .ForMember(dest => dest.PhotoUri, opt => opt.MapFrom(src => src.PhotoUrl));
        
        CreateMap<DietEntryDto, DietEntry>()
            .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => src.PhotoUri));

        // UpdateDietRequest is handled manually in service for partial updates
    }
}
