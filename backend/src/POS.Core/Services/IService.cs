using POS.Core.Entities;

namespace POS.Core.Services;

/// <summary>
/// Generic service interface for business logic operations
/// </summary>
public interface IService<TDto, TEntity> where TEntity : EntityBase
{
    Task<TDto?> GetByIdAsync(string id, string userId);
    Task<IEnumerable<TDto>> GetAllAsync(string userId);
    Task<TDto> CreateAsync(TDto dto, string userId);
    Task<TDto> UpdateAsync(string id, TDto dto, string userId);
    Task<bool> DeleteAsync(string id, string userId);
}
