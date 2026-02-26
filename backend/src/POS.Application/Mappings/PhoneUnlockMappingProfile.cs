using AutoMapper;
using POS.Application.DTOs.PhoneUnlock;
using POS.Core.Entities;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Phone Unlock entities
/// </summary>
public class PhoneUnlockMappingProfile : Profile
{
    public PhoneUnlockMappingProfile()
    {
        // PhoneUnlockEntry mappings
        CreateMap<PhoneUnlockEntry, PhoneUnlockEntryDto>();
        CreateMap<PhoneUnlockEntryDto, PhoneUnlockEntry>();

        CreateMap<CreatePhoneUnlockEntryRequest, PhoneUnlockEntry>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.UnlockedAt, opt => opt.MapFrom(src => src.UnlockedAt ?? DateTime.UtcNow))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}
