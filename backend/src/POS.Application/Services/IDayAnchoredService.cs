using POS.Application.DTOs;
using POS.Core.Entities;
using POS.Core.Services;

namespace POS.Application.Services;

/// <summary>
/// Service interface for day-anchored entities
/// </summary>
public interface IDayAnchoredService<TDto, TEntity> : IService<TDto, TEntity>
    where TDto : BaseDto
    where TEntity : DayAnchoredEntity
{
    Task<TDto?> GetByDayAsync(string userId, DateTime date);
    Task<IEnumerable<TDto>> GetByDateRangeAsync(string userId, DateTime startDate, DateTime endDate);
}
