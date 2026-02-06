using AutoMapper;
using POS.Application.DTOs.Deadlines;
using POS.Core.Entities.Deadlines;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Deadlines entities
/// </summary>
public class DeadlinesMappingProfile : Profile
{
    public DeadlinesMappingProfile()
    {
        // Deadline mappings
        CreateMap<Deadline, DeadlineDto>()
            .ForMember(dest => dest.DueDate, opt => opt.MapFrom(src => src.DueDate.ToString("yyyy-MM-dd")))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString().ToLower().Replace("onTrack", "on track")))
            .ForMember(dest => dest.DaysLeft, opt => opt.Ignore()); // Calculated in service
        
        CreateMap<DeadlineDto, Deadline>()
            .ForMember(dest => dest.DueDate, opt => opt.MapFrom(src => DateTime.ParseExact(src.DueDate, "yyyy-MM-dd", null)))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => 
                src.Status == "on track" ? DeadlineStatus.OnTrack :
                src.Status == "behind" ? DeadlineStatus.Behind :
                DeadlineStatus.Completed));

        CreateMap<CreateDeadlineRequest, Deadline>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.DueDate, opt => opt.MapFrom(src => DateTime.ParseExact(src.DueDate, "yyyy-MM-dd", null)))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => DeadlineStatus.OnTrack))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // UpdateDeadlineRequest is handled manually in service for partial updates
    }
}
