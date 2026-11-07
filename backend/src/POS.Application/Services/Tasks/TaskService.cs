using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Tasks;
using POS.Core.Exceptions;
using POS.Core.Repositories;
using TaskEntity = POS.Core.Entities.Tasks.Task;

namespace POS.Application.Services.Tasks;

/// <summary>
/// Manages user tasks for the current day.
/// </summary>
public class TaskService
{
    private readonly IRepository<TaskEntity> _taskRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<TaskService> _logger;

    public TaskService(
        IRepository<TaskEntity> taskRepository,
        IMapper mapper,
        ILogger<TaskService> logger)
    {
        _taskRepository = taskRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<TaskDto>> GetTodayTasksAsync(string userId)
    {
        _logger.LogInformation("Getting today's tasks for user {UserId}", userId);

        var today = DateTime.UtcNow.Date;
        var tasks = await _taskRepository.FindAsync(t => t.UserId == userId && t.Date == today);
        return _mapper.Map<List<TaskDto>>(tasks);
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskRequest request, string userId)
    {
        _logger.LogInformation("Creating task for user {UserId}", userId);

        var task = new TaskEntity
        {
            UserId = userId,
            Date = DateTime.UtcNow.Date,
            Title = request.Title,
            Category = request.Category,
            Completed = false,
            Source = "user",
        };

        var created = await _taskRepository.CreateAsync(task);
        return _mapper.Map<TaskDto>(created);
    }

    public async System.Threading.Tasks.Task CompleteTaskAsync(CompleteTaskRequest request, string userId)
    {
        _logger.LogInformation("Completing task {TaskId} for user {UserId}", request.Id, userId);

        var task = await _taskRepository.GetByIdAsync(request.Id, userId)
                   ?? throw new NotFoundException("Task", request.Id);

        task.Completed = true;
        await _taskRepository.UpdateAsync(task);
    }

    public async Task<bool> DeleteTaskAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting task {TaskId} for user {UserId}", id, userId);
        return await _taskRepository.DeleteAsync(id, userId);
    }
}
