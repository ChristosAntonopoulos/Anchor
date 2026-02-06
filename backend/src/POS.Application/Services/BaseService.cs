using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs;
using POS.Core.Entities;
using POS.Core.Exceptions;
using POS.Core.Repositories;
using POS.Core.Services;
using POS.Shared.Results;

namespace POS.Application.Services;

/// <summary>
/// Base service implementation with common CRUD operations
/// </summary>
public abstract class BaseService<TDto, TEntity> : IService<TDto, TEntity>
    where TDto : BaseDto
    where TEntity : EntityBase
{
    protected readonly IRepository<TEntity> _repository;
    protected readonly IMapper _mapper;
    protected readonly ILogger<BaseService<TDto, TEntity>> _logger;

    protected BaseService(
        IRepository<TEntity> repository,
        IMapper mapper,
        ILogger<BaseService<TDto, TEntity>> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    public virtual async Task<TDto?> GetByIdAsync(string id, string userId)
    {
        _logger.LogInformation("Getting {EntityType} with id {Id} for user {UserId}", typeof(TEntity).Name, id, userId);
        
        var entity = await _repository.GetByIdAsync(id, userId);
        if (entity == null)
        {
            _logger.LogWarning("{EntityType} with id {Id} not found for user {UserId}", typeof(TEntity).Name, id, userId);
            return null;
        }

        return _mapper.Map<TDto>(entity);
    }

    public virtual async Task<IEnumerable<TDto>> GetAllAsync(string userId)
    {
        _logger.LogInformation("Getting all {EntityType} for user {UserId}", typeof(TEntity).Name, userId);
        
        var entities = await _repository.GetByUserIdAsync(userId);
        return _mapper.Map<IEnumerable<TDto>>(entities);
    }

    public virtual async Task<TDto> CreateAsync(TDto dto, string userId)
    {
        _logger.LogInformation("Creating {EntityType} for user {UserId}", typeof(TEntity).Name, userId);
        
        var entity = _mapper.Map<TEntity>(dto);
        entity.UserId = userId;
        
        var created = await _repository.CreateAsync(entity);
        return _mapper.Map<TDto>(created);
    }

    public virtual async Task<TDto> UpdateAsync(string id, TDto dto, string userId)
    {
        _logger.LogInformation("Updating {EntityType} with id {Id} for user {UserId}", typeof(TEntity).Name, id, userId);
        
        var existing = await _repository.GetByIdAsync(id, userId);
        if (existing == null)
        {
            throw new NotFoundException(typeof(TEntity).Name, id);
        }

        _mapper.Map(dto, existing);
        existing.UserId = userId; // Ensure userId is not overwritten
        
        var updated = await _repository.UpdateAsync(existing);
        return _mapper.Map<TDto>(updated);
    }

    public virtual async Task<bool> DeleteAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting {EntityType} with id {Id} for user {UserId}", typeof(TEntity).Name, id, userId);
        
        var exists = await _repository.ExistsAsync(id, userId);
        if (!exists)
        {
            _logger.LogWarning("{EntityType} with id {Id} not found for user {UserId}", typeof(TEntity).Name, id, userId);
            return false;
        }

        return await _repository.DeleteAsync(id, userId);
    }
}
