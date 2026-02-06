using System.Linq.Expressions;
using MongoDB.Driver;
using POS.Core.Entities;
using POS.Core.Repositories;

namespace POS.Infrastructure.Repositories;

/// <summary>
/// Generic MongoDB repository implementation
/// </summary>
public class MongoRepository<T> : IRepository<T> where T : EntityBase
{
    protected readonly IMongoCollection<T> _collection;

    public MongoRepository(IMongoCollection<T> collection)
    {
        _collection = collection;
    }

    public virtual async Task<T?> GetByIdAsync(string id)
    {
        return await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    public virtual async Task<T?> GetByIdAsync(string id, string userId)
    {
        return await _collection.Find(x => x.Id == id && x.UserId == userId).FirstOrDefaultAsync();
    }

    public virtual async Task<IEnumerable<T>> GetByUserIdAsync(string userId)
    {
        return await _collection.Find(x => x.UserId == userId).ToListAsync();
    }

    public virtual async Task<T> CreateAsync(T entity)
    {
        entity.CreatedAt = DateTime.UtcNow;
        await _collection.InsertOneAsync(entity);
        return entity;
    }

    public virtual async Task<T> UpdateAsync(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        await _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);
        return entity;
    }

    public virtual async Task<bool> DeleteAsync(string id, string userId)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id && x.UserId == userId);
        return result.DeletedCount > 0;
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _collection.Find(predicate).ToListAsync();
    }

    public virtual async Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate)
    {
        return await _collection.Find(predicate).FirstOrDefaultAsync();
    }

    public virtual async Task<bool> ExistsAsync(string id, string userId)
    {
        var count = await _collection.CountDocumentsAsync(x => x.Id == id && x.UserId == userId);
        return count > 0;
    }

    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        var count = await _collection.CountDocumentsAsync(predicate);
        return count > 0;
    }

    public virtual async Task<long> CountAsync(string userId)
    {
        return await _collection.CountDocumentsAsync(x => x.UserId == userId);
    }

    public virtual async Task<long> CountAsync(Expression<Func<T, bool>> predicate)
    {
        return await _collection.CountDocumentsAsync(predicate);
    }
}
