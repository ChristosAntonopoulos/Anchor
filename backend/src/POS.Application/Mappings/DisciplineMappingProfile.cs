using AutoMapper;
using POS.Application.DTOs.Discipline;
using POS.Core.Entities.Discipline;

namespace POS.Application.Mappings;

/// <summary>
/// AutoMapper profile for Discipline entities
/// </summary>
public class DisciplineMappingProfile : Profile
{
    public DisciplineMappingProfile()
    {
        // DisciplineEntry mappings
        CreateMap<DisciplineEntry, DisciplineEntryDto>();
        
        CreateMap<DisciplineEntryDto, DisciplineEntry>();

        // UpdateDisciplineRequest is handled manually in service for partial updates
    }
}
