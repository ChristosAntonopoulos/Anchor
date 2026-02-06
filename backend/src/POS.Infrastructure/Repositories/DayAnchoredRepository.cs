using MongoDB.Driver;
using POS.Core.Entities;
using POS.Core.Repositories;

namespace POS.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for day-anchored entities
/// </summary>
public class DayAnchoredRepository<T> : MongoRepository<T>, IDayAnchoredRepository<T> where T : DayAnchoredEntity
{
    public DayAnchoredRepository(IMongoCollection<T> collection)
        : base(collection)
    {
    }

    public virtual async Task<T?> GetByDayAsync(string userId, DateTime date)
    {
        var dateOnly = date.Date;
        return await _collection.Find(x => x.UserId == userId && x.Date.Date == dateOnly).FirstOrDefaultAsync();
    }

    public virtual async Task<IEnumerable<T>> GetByDateRangeAsync(string userId, DateTime startDate, DateTime endDate)
    {
        var start = startDate.Date;
        var end = endDate.Date;
        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Eq(x => x.UserId, userId),
            Builders<T>.Filter.Gte(x => x.Date, start),
            Builders<T>.Filter.Lte(x => x.Date, end)
        );
        return await _collection.Find(filter).ToListAsync();
    }
}