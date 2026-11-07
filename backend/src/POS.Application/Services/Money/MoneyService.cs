using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Money;
using POS.Core.Entities.Money;
using POS.Core.Repositories;

namespace POS.Application.Services.Money;

/// <summary>
/// Manages income entries and calculates money summaries.
/// </summary>
public class MoneyService
{
    private readonly IRepository<IncomeEntry> _incomeRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<MoneyService> _logger;

    public MoneyService(
        IRepository<IncomeEntry> incomeRepository,
        IMapper mapper,
        ILogger<MoneyService> logger)
    {
        _incomeRepository = incomeRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<MoneySummaryDto> GetMoneySummaryAsync(string userId)
    {
        _logger.LogInformation("Getting money summary for user {UserId}", userId);

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var entries = await _incomeRepository.FindAsync(
            i => i.UserId == userId && i.Date >= startOfMonth && i.Date <= endOfMonth);

        var sorted = entries.OrderByDescending(i => i.Date).ToList();
        var monthlyTotal = sorted.Sum(i => i.Amount);
        var lastIncome = sorted.FirstOrDefault();
        var daysSinceLastIncome = lastIncome is not null
            ? (now.Date - lastIncome.Date.Date).Days
            : 0;

        return new MoneySummaryDto
        {
            MonthlyTotal = monthlyTotal,
            DaysSinceLastIncome = daysSinceLastIncome,
            Income = _mapper.Map<List<IncomeEntryDto>>(sorted),
        };
    }

    public async Task<IncomeEntryDto> CreateIncomeAsync(CreateIncomeRequest request, string userId)
    {
        _logger.LogInformation("Creating income entry for user {UserId}", userId);

        var income = new IncomeEntry
        {
            UserId = userId,
            Date = DateTime.Parse(request.Date),
            Source = request.Source,
            Amount = request.Amount,
            Currency = request.Currency,
        };

        var created = await _incomeRepository.CreateAsync(income);
        return _mapper.Map<IncomeEntryDto>(created);
    }

    public async Task<List<IncomeEntryDto>> GetAllIncomeAsync(string userId)
    {
        _logger.LogInformation("Getting all income entries for user {UserId}", userId);

        var entries = await _incomeRepository.FindAsync(i => i.UserId == userId);
        return _mapper.Map<List<IncomeEntryDto>>(
            entries.OrderByDescending(i => i.Date).ToList());
    }
}
