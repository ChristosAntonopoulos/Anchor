using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Money;
using POS.Core.Entities.Money;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Money;

/// <summary>
/// Service for managing money/income entries
/// </summary>
public class MoneyService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<MoneyService> _logger;

    public MoneyService(MongoDbContext context, IMapper mapper, ILogger<MoneyService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get money summary for current month
    /// </summary>
    public async Task<MoneySummaryDto> GetMoneySummaryAsync(string userId)
    {
        _logger.LogInformation("Getting money summary for user {UserId}", userId);
        
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);
        
        // Get all income entries for current month
        var incomeFilter = Builders<IncomeEntry>.Filter.And(
            Builders<IncomeEntry>.Filter.Eq(i => i.UserId, userId),
            Builders<IncomeEntry>.Filter.Gte(i => i.Date, startOfMonth),
            Builders<IncomeEntry>.Filter.Lte(i => i.Date, endOfMonth)
        );
        
        var incomeEntries = await _context.IncomeEntries
            .Find(incomeFilter)
            .SortByDescending(i => i.Date)
            .ToListAsync();
        
        var monthlyTotal = incomeEntries.Sum(i => i.Amount);
        
        // Calculate days since last income
        var lastIncome = incomeEntries.OrderByDescending(i => i.Date).FirstOrDefault();
        var daysSinceLastIncome = lastIncome != null 
            ? (now.Date - lastIncome.Date.Date).Days 
            : 0;
        
        return new MoneySummaryDto
        {
            MonthlyTotal = monthlyTotal,
            DaysSinceLastIncome = daysSinceLastIncome,
            Income = _mapper.Map<List<IncomeEntryDto>>(incomeEntries)
        };
    }

    /// <summary>
    /// Create an income entry
    /// </summary>
    public async Task<IncomeEntryDto> CreateIncomeAsync(CreateIncomeRequest request, string userId)
    {
        _logger.LogInformation("Creating income entry for user {UserId}", userId);
        
        var incomeDate = DateTime.Parse(request.Date);
        var income = new IncomeEntry
        {
            UserId = userId,
            Date = incomeDate,
            Source = request.Source,
            Amount = request.Amount,
            Currency = request.Currency
        };
        
        await _context.IncomeEntries.InsertOneAsync(income);
        return _mapper.Map<IncomeEntryDto>(income);
    }

    /// <summary>
    /// Get all income entries
    /// </summary>
    public async Task<List<IncomeEntryDto>> GetAllIncomeAsync(string userId)
    {
        _logger.LogInformation("Getting all income entries for user {UserId}", userId);
        
        var filter = Builders<IncomeEntry>.Filter.Eq(i => i.UserId, userId);
        var incomeEntries = await _context.IncomeEntries
            .Find(filter)
            .SortByDescending(i => i.Date)
            .ToListAsync();
        
        return _mapper.Map<List<IncomeEntryDto>>(incomeEntries);
    }
}
