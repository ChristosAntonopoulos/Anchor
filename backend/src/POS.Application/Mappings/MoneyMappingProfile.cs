using AutoMapper;
using POS.Application.DTOs.Money;
using POS.Core.Entities.Money;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Money entities
/// </summary>
public class MoneyMappingProfile : Profile
{
    public MoneyMappingProfile()
    {
        // IncomeEntry mappings
        CreateMap<IncomeEntry, IncomeEntryDto>()
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date.ToString("yyyy-MM-dd")));
        
        CreateMap<IncomeEntryDto, IncomeEntry>()
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => DateTime.ParseExact(src.Date, "yyyy-MM-dd", null)));

        CreateMap<CreateIncomeRequest, IncomeEntry>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => DateTime.ParseExact(src.Date, "yyyy-MM-dd", null)))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}
