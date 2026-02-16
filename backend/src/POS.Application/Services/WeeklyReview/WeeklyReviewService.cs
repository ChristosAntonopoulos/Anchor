using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.WeeklyReview;
using POS.Core.Entities.WeeklyReview;
using POS.Infrastructure.Data;
using System.Globalization;
using WeeklyReviewEntity = POS.Core.Entities.WeeklyReview.WeeklyReview;

namespace POS.Application.Services.WeeklyReview;

/// <summary>
/// Service for managing weekly reviews
/// </summary>
public class WeeklyReviewService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<WeeklyReviewService> _logger;

    public WeeklyReviewService(MongoDbContext context, IMapper mapper, ILogger<WeeklyReviewService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get current week's weekly review
    /// </summary>
    public async Task<WeeklyReviewDto> GetCurrentWeeklyReviewAsync(string userId)
    {
        _logger.LogInformation("Getting current weekly review for user {UserId}", userId);
        
        var weekId = GetCurrentWeekId();
        var filter = Builders<WeeklyReviewEntity>.Filter.And(
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.UserId, userId),
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.WeekId, weekId)
        );
        
        var review = await _context.WeeklyReviews.Find(filter).FirstOrDefaultAsync();
        
        if (review == null)
        {
            // Create default weekly review
            review = new WeeklyReviewEntity
            {
                UserId = userId,
                WeekId = weekId,
                AiSummary = string.Empty,
                Completed = false
            };
            await _context.WeeklyReviews.InsertOneAsync(review);
        }
        
        return _mapper.Map<WeeklyReviewDto>(review);
    }

    /// <summary>
    /// Submit weekly review answers
    /// </summary>
    public async Task<WeeklyReviewDto> SubmitWeeklyReviewAsync(SubmitWeeklyReviewRequest request, string userId)
    {
        _logger.LogInformation("Submitting weekly review for user {UserId}", userId);
        
        var weekId = GetCurrentWeekId();
        var filter = Builders<WeeklyReviewEntity>.Filter.And(
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.UserId, userId),
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.WeekId, weekId)
        );
        
        var review = await _context.WeeklyReviews.Find(filter).FirstOrDefaultAsync();
        
        if (review == null)
        {
            review = new WeeklyReviewEntity
            {
                UserId = userId,
                WeekId = weekId,
                AiSummary = string.Empty
            };
        }

        // Update with user answers
        review.Shipped = request.Shipped;
        review.Improved = request.Improved;
        review.Avoided = request.Avoided;
        review.NextFocus = request.NextFocus;
        review.Completed = true;
        review.CompletedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;
        
        if (string.IsNullOrEmpty(review.Id))
        {
            await _context.WeeklyReviews.InsertOneAsync(review);
        }
        else
        {
            await _context.WeeklyReviews.ReplaceOneAsync(filter, review);
        }
        
        return _mapper.Map<WeeklyReviewDto>(review);
    }

    /// <summary>
    /// Get current week ID in YYYY-WW format
    /// </summary>
    private string GetCurrentWeekId()
    {
        var now = DateTime.UtcNow;
        var calendar = CultureInfo.CurrentCulture.Calendar;
        var weekOfYear = calendar.GetWeekOfYear(now, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
        return $"{now.Year}-{weekOfYear:D2}";
    }

    /// <summary>
    /// Get weekly review by ID
    /// </summary>
    public async Task<WeeklyReviewDto?> GetWeeklyReviewByIdAsync(string id, string userId)
    {
        _logger.LogInformation("Getting weekly review {ReviewId} for user {UserId}", id, userId);
        
        var filter = Builders<WeeklyReviewEntity>.Filter.And(
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.Id, id),
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.UserId, userId)
        );
        
        var review = await _context.WeeklyReviews.Find(filter).FirstOrDefaultAsync();
        return review != null ? _mapper.Map<WeeklyReviewDto>(review) : null;
    }

    /// <summary>
    /// Get weekly reviews by date range
    /// </summary>
    public async Task<List<WeeklyReviewDto>> GetWeeklyReviewsByDateRangeAsync(string userId, DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("Getting weekly reviews from {StartDate} to {EndDate} for user {UserId}", startDate, endDate, userId);
        
        // Generate week IDs for the date range
        var weekIds = new List<string>();
        var currentDate = startDate;
        while (currentDate <= endDate)
        {
            var calendar = CultureInfo.CurrentCulture.Calendar;
            var weekOfYear = calendar.GetWeekOfYear(currentDate, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
            var weekId = $"{currentDate.Year}-{weekOfYear:D2}";
            if (!weekIds.Contains(weekId))
            {
                weekIds.Add(weekId);
            }
            currentDate = currentDate.AddDays(7);
        }
        
        var filter = Builders<WeeklyReviewEntity>.Filter.And(
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.UserId, userId),
            Builders<WeeklyReviewEntity>.Filter.In(wr => wr.WeekId, weekIds)
        );
        
        var sort = Builders<WeeklyReviewEntity>.Sort.Descending(wr => wr.WeekId);
        
        var reviews = await _context.WeeklyReviews
            .Find(filter)
            .Sort(sort)
            .ToListAsync();
        
        return _mapper.Map<List<WeeklyReviewDto>>(reviews);
    }

    /// <summary>
    /// Update weekly review
    /// </summary>
    public async Task<WeeklyReviewDto?> UpdateWeeklyReviewAsync(string id, UpdateWeeklyReviewRequest request, string userId)
    {
        _logger.LogInformation("Updating weekly review {ReviewId} for user {UserId}", id, userId);
        
        var filter = Builders<WeeklyReviewEntity>.Filter.And(
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.Id, id),
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.UserId, userId)
        );
        
        var existing = await _context.WeeklyReviews.Find(filter).FirstOrDefaultAsync();
        if (existing == null)
        {
            return null;
        }
        
        var updateBuilder = Builders<WeeklyReviewEntity>.Update
            .Set(wr => wr.UpdatedAt, DateTime.UtcNow);
        
        if (request.AiSummary != null) updateBuilder = updateBuilder.Set(wr => wr.AiSummary, request.AiSummary);
        if (request.Shipped != null) updateBuilder = updateBuilder.Set(wr => wr.Shipped, request.Shipped);
        if (request.Improved != null) updateBuilder = updateBuilder.Set(wr => wr.Improved, request.Improved);
        if (request.Avoided != null) updateBuilder = updateBuilder.Set(wr => wr.Avoided, request.Avoided);
        if (request.NextFocus != null) updateBuilder = updateBuilder.Set(wr => wr.NextFocus, request.NextFocus);
        if (request.Completed.HasValue)
        {
            updateBuilder = updateBuilder.Set(wr => wr.Completed, request.Completed.Value);
            if (request.Completed.Value && existing.CompletedAt == null)
            {
                updateBuilder = updateBuilder.Set(wr => wr.CompletedAt, DateTime.UtcNow);
            }
        }
        
        await _context.WeeklyReviews.UpdateOneAsync(filter, updateBuilder);
        
        var updated = await _context.WeeklyReviews.Find(filter).FirstOrDefaultAsync();
        return updated != null ? _mapper.Map<WeeklyReviewDto>(updated) : null;
    }

    /// <summary>
    /// Delete weekly review
    /// </summary>
    public async Task<bool> DeleteWeeklyReviewAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting weekly review {ReviewId} for user {UserId}", id, userId);
        
        var filter = Builders<WeeklyReviewEntity>.Filter.And(
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.Id, id),
            Builders<WeeklyReviewEntity>.Filter.Eq(wr => wr.UserId, userId)
        );
        
        var result = await _context.WeeklyReviews.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }
}
