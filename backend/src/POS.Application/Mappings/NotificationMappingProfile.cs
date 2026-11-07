using AutoMapper;
using POS.Application.DTOs.Notifications;
using POS.Core.Entities.Notifications;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Notification entities
/// </summary>
public class NotificationMappingProfile : Profile
{
    public NotificationMappingProfile()
    {
        // Notification action mappings
        CreateMap<NotificationAction, NotificationActionDto>().ReverseMap();

        // Notification mappings
        CreateMap<Notification, NotificationDto>().ReverseMap();

        CreateMap<CreateNotificationRequest, Notification>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.IsDismissed, opt => opt.Ignore())
            .ForMember(dest => dest.IsRead, opt => opt.Ignore())
            .ForMember(dest => dest.IsIgnored, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // Notification settings mappings
        CreateMap<NotificationSettings, NotificationSettingsDto>().ReverseMap();
    }
}
