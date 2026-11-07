using AutoMapper;
using POS.Application.DTOs.Discipline;
using POS.Core.Entities.Discipline;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Discipline entities
/// </summary>
public class DisciplineMappingProfile : Profile
{
    public DisciplineMappingProfile()
    {
        // DisciplineItem mappings
        CreateMap<DisciplineItem, DisciplineItemDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString().ToLower()));
        
        CreateMap<DisciplineItemDto, DisciplineItem>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => Enum.Parse<DisciplineItemType>(src.Type, true)));

        // DisciplineBlock mappings
        CreateMap<DisciplineBlock, DisciplineBlockDto>();
        CreateMap<DisciplineBlockDto, DisciplineBlock>();

        // DisciplineEntry mappings
        CreateMap<DisciplineEntry, DisciplineEntryDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt))
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date))
            .ForMember(dest => dest.Blocks, opt => opt.MapFrom(src => src.Blocks ?? new List<DisciplineBlock>()))
            .ForMember(dest => dest.Note, opt => opt.MapFrom(src => src.Note));
        
        CreateMap<DisciplineEntryDto, DisciplineEntry>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date))
            .ForMember(dest => dest.Blocks, opt => opt.MapFrom(src => src.Blocks))
            .ForMember(dest => dest.Note, opt => opt.MapFrom(src => src.Note));

        // UpdateDisciplineRequest is handled manually in service for partial updates
    }
}
