using AutoMapper;
using POS.Application.DTOs.Tasks;
using POS.Core.Entities.Tasks;
using TaskEntity = POS.Core.Entities.Tasks.Task;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Tasks entities
/// </summary>
public class TasksMappingProfile : Profile
{
    public TasksMappingProfile()
    {
        // Value object mappings
        CreateMap<Subtask, SubtaskDto>().ReverseMap();
        CreateMap<Location, LocationDto>().ReverseMap();
        CreateMap<RecurrencePattern, RecurrencePatternDto>().ReverseMap();
        CreateMap<Reminder, ReminderDto>().ReverseMap();

        // Task mappings
        CreateMap<TaskEntity, TaskDto>()
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date));
        
        CreateMap<TaskDto, TaskEntity>()
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date));

        CreateMap<CreateTaskRequest, TaskEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.Date, opt => opt.Ignore())
            .ForMember(dest => dest.Completed, opt => opt.Ignore())
            .ForMember(dest => dest.Source, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.PlannedDate, opt => opt.Ignore())
            .ForMember(dest => dest.FocusRank, opt => opt.Ignore())
            .ForMember(dest => dest.CompletedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}
