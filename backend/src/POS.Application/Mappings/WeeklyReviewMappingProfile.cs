using AutoMapper;
using POS.Application.DTOs.WeeklyReview;
using POS.Core.Entities.WeeklyReview;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Weekly Review entities
/// </summary>
public class WeeklyReviewMappingProfile : Profile
{
    public WeeklyReviewMappingProfile()
    {
        // WeeklyReview mappings
        CreateMap<WeeklyReview, WeeklyReviewDto>()
            .ReverseMap();

        // SubmitWeeklyReviewRequest is handled manually in service for partial updates
    }
}
