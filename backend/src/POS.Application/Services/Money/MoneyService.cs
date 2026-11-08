using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Money;
using POS.Core.Entities.Money;
using POS.Core.Entities.Notifications;
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

        await SyncWalletSpendsAsync(userId);

        var spendFilter = Builders<WalletSpend>.Filter.And(
            Builders<WalletSpend>.Filter.Eq(s => s.UserId, userId),
            Builders<WalletSpend>.Filter.Gte(s => s.Date, startOfMonth),
            Builders<WalletSpend>.Filter.Lte(s => s.Date, endOfMonth)
        );
        var walletSpend = await _context.WalletSpends
            .Find(spendFilter)
            .SortByDescending(s => s.Date)
            .ToListAsync();
        
        // Calculate days since last income
        var lastIncome = incomeEntries.OrderByDescending(i => i.Date).FirstOrDefault();
        var daysSinceLastIncome = lastIncome != null 
            ? (now.Date - lastIncome.Date.Date).Days 
            : 0;
        
        return new MoneySummaryDto
        {
            MonthlyTotal = monthlyTotal,
            DaysSinceLastIncome = daysSinceLastIncome,
            Income = _mapper.Map<List<IncomeEntryDto>>(incomeEntries),
            MonthlyWalletSpend = walletSpend.Sum(s => s.Amount),
            WalletSpend = _mapper.Map<List<WalletSpendDto>>(walletSpend)
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

    /// <summary>
    /// Get income entry by ID
    /// </summary>
    public async Task<IncomeEntryDto?> GetIncomeByIdAsync(string id, string userId)
    {
        _logger.LogInformation("Getting income entry {IncomeId} for user {UserId}", id, userId);
        
        var filter = Builders<IncomeEntry>.Filter.And(
            Builders<IncomeEntry>.Filter.Eq(i => i.Id, id),
            Builders<IncomeEntry>.Filter.Eq(i => i.UserId, userId)
        );
        
        var income = await _context.IncomeEntries.Find(filter).FirstOrDefaultAsync();
        return income != null ? _mapper.Map<IncomeEntryDto>(income) : null;
    }

    /// <summary>
    /// Update income entry
    /// </summary>
    public async Task<IncomeEntryDto?> UpdateIncomeAsync(string id, UpdateIncomeRequest request, string userId)
    {
        _logger.LogInformation("Updating income entry {IncomeId} for user {UserId}", id, userId);
        
        var filter = Builders<IncomeEntry>.Filter.And(
            Builders<IncomeEntry>.Filter.Eq(i => i.Id, id),
            Builders<IncomeEntry>.Filter.Eq(i => i.UserId, userId)
        );
        
        var existing = await _context.IncomeEntries.Find(filter).FirstOrDefaultAsync();
        if (existing == null)
        {
            return null;
        }
        
        var updateBuilder = Builders<IncomeEntry>.Update
            .Set(i => i.UpdatedAt, DateTime.UtcNow);
        
        if (request.Date != null)
        {
            var incomeDate = DateTime.Parse(request.Date);
            updateBuilder = updateBuilder.Set(i => i.Date, incomeDate);
        }
        
        if (request.Source != null)
        {
            updateBuilder = updateBuilder.Set(i => i.Source, request.Source);
        }
        
        if (request.Amount.HasValue)
        {
            updateBuilder = updateBuilder.Set(i => i.Amount, request.Amount.Value);
        }
        
        if (request.Currency != null)
        {
            updateBuilder = updateBuilder.Set(i => i.Currency, request.Currency);
        }
        
        await _context.IncomeEntries.UpdateOneAsync(filter, updateBuilder);
        
        var updated = await _context.IncomeEntries.Find(filter).FirstOrDefaultAsync();
        return updated != null ? _mapper.Map<IncomeEntryDto>(updated) : null;
    }

    /// <summary>
    /// Delete income entry
    /// </summary>
    public async Task<bool> DeleteIncomeAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting income entry {IncomeId} for user {UserId}", id, userId);
        
        var filter = Builders<IncomeEntry>.Filter.And(
            Builders<IncomeEntry>.Filter.Eq(i => i.Id, id),
            Builders<IncomeEntry>.Filter.Eq(i => i.UserId, userId)
        );
        
        var result = await _context.IncomeEntries.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }

    public async Task<WalletSpendDto> CreateWalletSpendAsync(CreateWalletSpendRequest request, string userId)
    {
        var existing = await FindSpendBySourceAsync(userId, request.SourceNotificationId);
        if (existing != null)
        {
            return _mapper.Map<WalletSpendDto>(existing);
        }

        var spend = new WalletSpend
        {
            UserId = userId,
            Date = DateTime.Parse(request.Date),
            Merchant = request.Merchant,
            Amount = request.Amount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EUR" : request.Currency.ToUpperInvariant(),
            SourceNotificationId = request.SourceNotificationId,
            PackageName = request.PackageName,
            RawText = request.RawText
        };

        try
        {
            await _context.WalletSpends.InsertOneAsync(spend);
        }
        catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
        {
            existing = await FindSpendBySourceAsync(userId, request.SourceNotificationId);
            if (existing != null)
            {
                return _mapper.Map<WalletSpendDto>(existing);
            }

            throw;
        }

        return _mapper.Map<WalletSpendDto>(spend);
    }

    public async Task TryIngestWalletNotificationAsync(Notification notification, string userId)
    {
        try
        {
            var parsed = WalletSpendParser.TryParse(notification);
            if (parsed == null)
            {
                return;
            }

            await CreateWalletSpendAsync(new CreateWalletSpendRequest
            {
                Date = parsed.Date,
                Merchant = parsed.Merchant,
                Amount = parsed.Amount,
                Currency = parsed.Currency,
                SourceNotificationId = parsed.SourceNotificationId,
                PackageName = parsed.PackageName,
                RawText = parsed.RawText
            }, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not ingest Google Wallet notification {NotificationId}", notification.Id);
        }
    }

    public async Task SyncWalletSpendsAsync(string userId)
    {
        var since = DateTime.UtcNow.AddDays(-120);
        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.UserId, userId),
            Builders<Notification>.Filter.Gte(n => n.PostTime, since)
        );

        var projection = Builders<Notification>.Projection
            .Exclude(n => n.AppIcon)
            .Exclude(n => n.BigPicture);
        var notifications = await _context.Notifications
            .Find(filter)
            .Project<Notification>(projection)
            .SortByDescending(n => n.PostTime)
            .Limit(400)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            await TryIngestWalletNotificationAsync(notification, userId);
        }
    }

    private async Task<WalletSpend?> FindSpendBySourceAsync(string userId, string sourceNotificationId)
    {
        var filter = Builders<WalletSpend>.Filter.And(
            Builders<WalletSpend>.Filter.Eq(s => s.UserId, userId),
            Builders<WalletSpend>.Filter.Eq(s => s.SourceNotificationId, sourceNotificationId)
        );
        return await _context.WalletSpends.Find(filter).FirstOrDefaultAsync();
    }
}
