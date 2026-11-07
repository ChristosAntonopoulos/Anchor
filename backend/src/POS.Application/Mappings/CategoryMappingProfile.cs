using AutoMapper;
using POS.Application.DTOs.Category;
using POS.Core.Entities;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Category entities
/// </summary>
public class CategoryMappingProfile : Profile
{
    public CategoryMappingProfile()
    {
        CreateMap<Category, CategoryDto>();
        CreateMap<CategoryDto, Category>();

        CreateMap<CreateCategoryRequest, Category>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => string.Empty))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }
}
