using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Diet;
using POS.Core.Entities.Diet;
using POS.Core.Repositories;

namespace POS.Application.Services.Diet;

/// <summary>
/// Manages today's diet entry. Owns get-or-create semantics so callers
/// receive a valid entry even on first access.
/// </summary>
public class DietService
{
    private readonly IDayAnchoredRepository<DietEntry> _dietRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<DietService> _logger;

    public DietService(
        IDayAnchoredRepository<DietEntry> dietRepository,
        IMapper mapper,
        ILogger<DietService> logger)
    {
        _dietRepository = dietRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Returns today's diet entry, creating a default one if none exists.
    /// </summary>
    public async Task<DietEntryDto> GetTodayDietAsync(string userId)
    {
        _logger.LogInformation("Getting today's diet entry for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var diet = await _dietRepository.GetByDayAsync(userId, today)
                   ?? await CreateDefaultAsync(userId, today);

        return _mapper.Map<DietEntryDto>(diet);
    }

    /// <summary>
    /// Applies a partial update to today's diet entry.
    /// </summary>
    public async Task<DietEntryDto> UpdateDietAsync(UpdateDietRequest request, string userId)
    {
        _logger.LogInformation("Updating diet entry for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var diet = await _dietRepository.GetByDayAsync(userId, today)
                   ?? await CreateDefaultAsync(userId, today);

        if (request.Compliant.HasValue)
            diet.Compliant = request.Compliant.Value;
        if (request.PhotoUri is not null)
            diet.PhotoUri = request.PhotoUri;
        if (request.Note is not null)
            diet.Note = request.Note;

        await _dietRepository.UpdateAsync(diet);
        return _mapper.Map<DietEntryDto>(diet);
    }

    private async Task<DietEntry> CreateDefaultAsync(string userId, DateTime date)
    {
        var entry = new DietEntry { UserId = userId, Date = date };
        return await _dietRepository.CreateAsync(entry);
    }
}
