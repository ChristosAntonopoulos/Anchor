using AutoMapper;
using POS.Application.DTOs;
using POS.Core.Entities;

namespace POS.Application.Mappings;

/// <summary>
/// Base AutoMapper profile with common mappings
/// </summary>
public class BaseMappingProfile : Profile
{
    public BaseMappingProfile()
    {
        // Common entity to DTO mapping
        CreateMap<EntityBase, BaseDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt));

        // Common DTO to entity mapping
        CreateMap<BaseDto, EntityBase>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore()) // Set by repository
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore()) // Set by repository
            .ForMember(dest => dest.UserId, opt => opt.Ignore()); // Set by service
    }
}
