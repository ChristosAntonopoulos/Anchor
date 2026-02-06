using POS.Core.Entities;

namespace POS.Core.Repositories;

/// <summary>
/// Repository interface for day-anchored entities
/// </summary>
public interface IDayAnchoredRepository<T> : IRepository<T> where T : DayAnchoredEntity
{
    Task<T?> GetByDayAsync(string userId, DateTime date);
    Task<IEnumerable<T>> GetByDateRangeAsync(string userId, DateTime startDate, DateTime endDate);
}