using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Schedule;
using POS.Core.Entities.Schedule;
using POS.Core.Exceptions;
using POS.Core.Repositories;

namespace POS.Application.Services.Schedule;

/// <summary>
/// Manages schedule block definitions and today's block instances.
/// </summary>
public class ScheduleService
{
    private readonly IRepository<ScheduleBlockInstance> _instanceRepository;
    private readonly IRepository<ScheduleBlockDefinition> _definitionRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<ScheduleService> _logger;

    public ScheduleService(
        IRepository<ScheduleBlockInstance> instanceRepository,
        IRepository<ScheduleBlockDefinition> definitionRepository,
        IMapper mapper,
        ILogger<ScheduleService> logger)
    {
        _instanceRepository = instanceRepository;
        _definitionRepository = definitionRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<ScheduleBlockInstanceDto>> GetTodayScheduleAsync(string userId)
    {
        _logger.LogInformation("Getting today's schedule for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var blocks = await _instanceRepository.FindAsync(sb => sb.UserId == userId && sb.Date == today);

        return _mapper.Map<List<ScheduleBlockInstanceDto>>(
            blocks.OrderBy(sb => sb.StartTime).ToList());
    }

    public async Task<ScheduleBlockDefinitionDto> CreateDefinitionAsync(
        CreateScheduleBlockDefinitionDto dto, string userId)
    {
        _logger.LogInformation("Creating schedule block definition for user {UserId}", userId);

        var definition = _mapper.Map<ScheduleBlockDefinition>(dto);
        definition.UserId = userId;

        var created = await _definitionRepository.CreateAsync(definition);
        return _mapper.Map<ScheduleBlockDefinitionDto>(created);
    }

    public async Task<ScheduleBlockInstanceDto> UpdateBlockAsync(
        UpdateScheduleBlockRequest request, string userId)
    {
        _logger.LogInformation("Updating schedule block {BlockId} for user {UserId}", request.Id, userId);

        var block = await _instanceRepository.GetByIdAsync(request.Id, userId)
                    ?? throw new NotFoundException("ScheduleBlock", request.Id);

        if (!string.IsNullOrEmpty(request.Title)) block.Title = request.Title;
        if (!string.IsNullOrEmpty(request.StartTime)) block.StartTime = request.StartTime;
        if (!string.IsNullOrEmpty(request.EndTime)) block.EndTime = request.EndTime;

        await _instanceRepository.UpdateAsync(block);
        return _mapper.Map<ScheduleBlockInstanceDto>(block);
    }

    public async Task<bool> DeleteBlockAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting schedule block {BlockId} for user {UserId}", id, userId);
        return await _instanceRepository.DeleteAsync(id, userId);
    }
}
