using AutoMapper;
using POS.Application.DTOs.BetterToday;
using POS.Core.Entities.BetterToday;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Better Today entities
/// </summary>
public class BetterTodayMappingProfile : Profile
{
    public BetterTodayMappingProfile()
    {
        // BetterItem mappings
        CreateMap<BetterItem, BetterItemDto>();
        
        CreateMap<BetterItemDto, BetterItem>();

        CreateMap<CreateBetterItemDto, BetterItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => DateTime.UtcNow.Date))
            .ForMember(dest => dest.Completed, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.Source, opt => opt.MapFrom(src => "user"))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}
