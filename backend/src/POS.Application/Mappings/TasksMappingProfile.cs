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
        // Task mappings
        CreateMap<TaskEntity, TaskDto>();
        
        CreateMap<TaskDto, TaskEntity>();

        CreateMap<CreateTaskRequest, TaskEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => DateTime.UtcNow.Date))
            .ForMember(dest => dest.Completed, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.Source, opt => opt.MapFrom(src => "user"))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}
