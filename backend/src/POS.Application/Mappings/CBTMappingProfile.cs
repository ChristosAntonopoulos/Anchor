using AutoMapper;
using POS.Application.DTOs.CBT;
using POS.Core.Entities.CBT;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for CBT entities
/// </summary>
public class CBTMappingProfile : Profile
{
    public CBTMappingProfile()
    {
        // AutomaticThought mappings
        CreateMap<AutomaticThought, AutomaticThoughtDto>();
        CreateMap<AutomaticThoughtDto, AutomaticThought>();

        // CBTEntry mappings
        CreateMap<CBTEntry, CBTEntryDto>();
        CreateMap<CBTEntryDto, CBTEntry>();

        CreateMap<CreateCBTEntryRequest, CBTEntry>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "pending"))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Mood, opt => opt.Ignore())
            .ForMember(dest => dest.MoodIntensity, opt => opt.Ignore())
            .ForMember(dest => dest.Situation, opt => opt.Ignore())
            .ForMember(dest => dest.AutomaticThoughts, opt => opt.Ignore())
            .ForMember(dest => dest.CognitiveDistortions, opt => opt.Ignore())
            .ForMember(dest => dest.EvidenceFor, opt => opt.Ignore())
            .ForMember(dest => dest.EvidenceAgainst, opt => opt.Ignore())
            .ForMember(dest => dest.AlternativeThoughts, opt => opt.Ignore())
            .ForMember(dest => dest.Behaviors, opt => opt.Ignore())
            .ForMember(dest => dest.Outcome, opt => opt.Ignore())
            .ForMember(dest => dest.ProcessedAt, opt => opt.Ignore())
            .ForMember(dest => dest.AIInsights, opt => opt.Ignore());

        // MoodEntry mappings
        CreateMap<MoodEntry, MoodEntryDto>();
        CreateMap<MoodEntryDto, MoodEntry>();

        CreateMap<CreateMoodEntryRequest, MoodEntry>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // BehavioralActivity mappings
        CreateMap<BehavioralActivity, BehavioralActivityDto>();
        CreateMap<BehavioralActivityDto, BehavioralActivity>();

        CreateMap<CreateBehavioralActivityRequest, BehavioralActivity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.IsCompleted, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.CompletedDate, opt => opt.Ignore())
            .ForMember(dest => dest.MoodBefore, opt => opt.Ignore())
            .ForMember(dest => dest.MoodAfter, opt => opt.Ignore())
            .ForMember(dest => dest.PleasureRating, opt => opt.Ignore())
            .ForMember(dest => dest.MasteryRating, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}
