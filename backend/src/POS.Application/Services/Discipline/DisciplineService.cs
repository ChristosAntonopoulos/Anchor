using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Discipline;
using POS.Core.Entities.Discipline;
using POS.Core.Repositories;

namespace POS.Application.Services.Discipline;

/// <summary>
/// Manages today's discipline entry. Owns get-or-create semantics so callers
/// receive a valid entry even on first access.
/// </summary>
public class DisciplineService
{
    private readonly IDayAnchoredRepository<DisciplineEntry> _disciplineRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<DisciplineService> _logger;

    public DisciplineService(
        IDayAnchoredRepository<DisciplineEntry> disciplineRepository,
        IMapper mapper,
        ILogger<DisciplineService> logger)
    {
        _disciplineRepository = disciplineRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Returns today's discipline entry, creating a default one if none exists.
    /// </summary>
    public async Task<DisciplineEntryDto> GetTodayDisciplineAsync(string userId)
    {
        _logger.LogInformation("Getting today's discipline entry for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var discipline = await _disciplineRepository.GetByDayAsync(userId, today)
                         ?? await CreateDefaultAsync(userId, today);

        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    /// <summary>
    /// Applies a partial update to today's discipline entry.
    /// </summary>
    public async Task<DisciplineEntryDto> UpdateDisciplineAsync(UpdateDisciplineRequest request, string userId)
    {
        _logger.LogInformation("Updating discipline entry for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var discipline = await _disciplineRepository.GetByDayAsync(userId, today)
                         ?? await CreateDefaultAsync(userId, today);

        if (request.Gym.HasValue) discipline.Gym = request.Gym.Value;
        if (request.Walk.HasValue) discipline.Walk = request.Walk.Value;
        if (request.Cooked.HasValue) discipline.Cooked = request.Cooked.Value;
        if (request.Diet.HasValue) discipline.Diet = request.Diet.Value;
        if (request.Meditation.HasValue) discipline.Meditation = request.Meditation.Value;
        if (request.Water.HasValue) discipline.Water = request.Water.Value;
        if (request.Note is not null) discipline.Note = request.Note;

        await _disciplineRepository.UpdateAsync(discipline);
        return _mapper.Map<DisciplineEntryDto>(discipline);
    }

    private async Task<DisciplineEntry> CreateDefaultAsync(string userId, DateTime date)
    {
        var entry = new DisciplineEntry { UserId = userId, Date = date };
        return await _disciplineRepository.CreateAsync(entry);
    }
}
