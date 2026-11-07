namespace POS.Application.DTOs.Tasks;

public class TaskInboxResponseDto
{
    public List<TaskDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
}
