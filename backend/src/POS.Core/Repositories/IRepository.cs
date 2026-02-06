using System.Linq.Expressions;
using POS.Core.Entities;

namespace POS.Core.Repositories;

/// <summary>
/// Generic repository interface for MongoDB operations
/// </summary>
public interface IRepository<T> where T : EntityBase
{
    Task<T?> GetByIdAsync(string id);
    Task<T?> GetByIdAsync(string id, string userId);
    Task<IEnumerable<T>> GetByUserIdAsync(string userId);
    Task<T> CreateAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task<bool> DeleteAsync(string id, string userId);
    
    // Enhanced query methods
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate);
    Task<bool> ExistsAsync(string id, string userId);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
    Task<long> CountAsync(string userId);
    Task<long> CountAsync(Expression<Func<T, bool>> predicate);
}
