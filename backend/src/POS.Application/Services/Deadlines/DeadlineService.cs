using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Deadlines;
using POS.Core.Entities.Deadlines;
using POS.Core.Exceptions;
using POS.Core.Repositories;

namespace POS.Application.Services.Deadlines;

/// <summary>
/// Manages deadlines: creation, retrieval, update, and deletion.
/// </summary>
public class DeadlineService
{
    private readonly IRepository<Deadline> _deadlineRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<DeadlineService> _logger;

    public DeadlineService(
        IRepository<Deadline> deadlineRepository,
        IMapper mapper,
        ILogger<DeadlineService> logger)
    {
        _deadlineRepository = deadlineRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<DeadlineDto>> GetAllDeadlinesAsync(string userId)
    {
        _logger.LogInformation("Getting all deadlines for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var deadlines = await _deadlineRepository.FindAsync(
            d => d.UserId == userId && d.Status != DeadlineStatus.Completed);

        var sorted = deadlines.OrderBy(d => d.DueDate).ToList();
        var dtos = _mapper.Map<List<DeadlineDto>>(sorted);

        foreach (var dto in dtos)
        {
            if (DateTime.TryParse(dto.DueDate, out var dueDate))
                dto.DaysLeft = (dueDate.Date - today).Days;
        }

        return dtos;
    }

    public async Task<DeadlineDto> CreateDeadlineAsync(CreateDeadlineRequest request, string userId)
    {
        _logger.LogInformation("Creating deadline for user {UserId}", userId);

        var dueDate = DateTime.Parse(request.DueDate);
        var deadline = new Deadline
        {
            UserId = userId,
            Title = request.Title,
            DueDate = dueDate,
            Importance = request.Importance,
            Status = DeadlineStatus.OnTrack,
        };

        var created = await _deadlineRepository.CreateAsync(deadline);
        var dto = _mapper.Map<DeadlineDto>(created);
        dto.DaysLeft = (dueDate.Date - DateTime.UtcNow.Date).Days;
        return dto;
    }

    public async Task<DeadlineDto> UpdateDeadlineAsync(UpdateDeadlineRequest request, string userId)
    {
        _logger.LogInformation("Updating deadline {DeadlineId} for user {UserId}", request.Id, userId);

        var deadline = await _deadlineRepository.GetByIdAsync(request.Id, userId)
                       ?? throw new NotFoundException("Deadline", request.Id);

        if (!string.IsNullOrEmpty(request.Title)) deadline.Title = request.Title;
        if (!string.IsNullOrEmpty(request.DueDate)) deadline.DueDate = DateTime.Parse(request.DueDate);
        if (!string.IsNullOrEmpty(request.Status))
        {
            deadline.Status = request.Status switch
            {
                "on track" => DeadlineStatus.OnTrack,
                "behind" => DeadlineStatus.Behind,
                "completed" => DeadlineStatus.Completed,
                _ => deadline.Status,
            };
        }
        if (request.Importance.HasValue) deadline.Importance = request.Importance.Value;

        await _deadlineRepository.UpdateAsync(deadline);

        var dto = _mapper.Map<DeadlineDto>(deadline);
        dto.DaysLeft = (deadline.DueDate.Date - DateTime.UtcNow.Date).Days;
        return dto;
    }

    public async Task<bool> DeleteDeadlineAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting deadline {DeadlineId} for user {UserId}", id, userId);
        return await _deadlineRepository.DeleteAsync(id, userId);
    }
}
