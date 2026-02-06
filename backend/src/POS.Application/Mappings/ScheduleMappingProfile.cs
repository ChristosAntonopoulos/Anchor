using AutoMapper;
using POS.Application.DTOs.Schedule;
using POS.Core.Entities.Schedule;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Schedule entities
/// </summary>
public class ScheduleMappingProfile : Profile
{
    public ScheduleMappingProfile()
    {
        // ScheduleBlockDefinition mappings
        CreateMap<ScheduleBlockDefinition, ScheduleBlockDefinitionDto>()
            .ForMember(dest => dest.Kind, opt => opt.MapFrom(src => src.Kind.ToString().ToLower()))
            .ForMember(dest => dest.Recurrence, opt => opt.MapFrom(src => src.Recurrence.ToString().ToLower()))
            .ForMember(dest => dest.Energy, opt => opt.MapFrom(src => src.Energy.ToString().ToLower()))
            .ReverseMap()
            .ForMember(dest => dest.Kind, opt => opt.MapFrom(src => Enum.Parse<ScheduleBlockKind>(src.Kind, true)))
            .ForMember(dest => dest.Recurrence, opt => opt.MapFrom(src => Enum.Parse<RecurrenceType>(src.Recurrence, true)))
            .ForMember(dest => dest.Energy, opt => opt.MapFrom(src => Enum.Parse<EnergyLevel>(src.Energy, true)));

        CreateMap<CreateScheduleBlockDefinitionDto, ScheduleBlockDefinition>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.Kind, opt => opt.MapFrom(src => Enum.Parse<ScheduleBlockKind>(src.Kind, true)))
            .ForMember(dest => dest.Recurrence, opt => opt.MapFrom(src => Enum.Parse<RecurrenceType>(src.Recurrence, true)))
            .ForMember(dest => dest.Energy, opt => opt.MapFrom(src => Enum.Parse<EnergyLevel>(src.Energy, true)))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // ScheduleBlockInstance mappings
        CreateMap<ScheduleBlockInstance, ScheduleBlockInstanceDto>();
        
        CreateMap<ScheduleBlockInstanceDto, ScheduleBlockInstance>();

        // UpdateScheduleBlockRequest is handled manually in service
    }
}
