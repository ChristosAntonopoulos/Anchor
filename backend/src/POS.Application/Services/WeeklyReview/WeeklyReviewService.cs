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
}
