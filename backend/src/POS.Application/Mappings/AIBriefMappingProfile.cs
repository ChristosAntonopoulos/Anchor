using AutoMapper;
using POS.Application.DTOs.AIBrief;
using POS.Core.Entities.AIBrief;

namespace POS.Application.Mappings;

public class AIBriefMappingProfile : Profile
{
    public AIBriefMappingProfile()
    {
        CreateMap<DayStartPlan, DayStartPlanDto>();
        CreateMap<YesterdayAssessment, YesterdayAssessmentDto>();
    }
}
