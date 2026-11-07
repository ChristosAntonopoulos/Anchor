using AutoMapper;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.WeeklyReview;
using POS.Core.Repositories;
using System.Globalization;
using WeeklyReviewEntity = POS.Core.Entities.WeeklyReview.WeeklyReview;

namespace POS.Application.Services.WeeklyReview;

/// <summary>
/// Manages the current week's review record.
/// </summary>
public class WeeklyReviewService
{
    private readonly IRepository<WeeklyReviewEntity> _reviewRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<WeeklyReviewService> _logger;

    public WeeklyReviewService(
        IRepository<WeeklyReviewEntity> reviewRepository,
        IMapper mapper,
        ILogger<WeeklyReviewService> logger)
    {
        _reviewRepository = reviewRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<WeeklyReviewDto> GetCurrentWeeklyReviewAsync(string userId)
    {
        _logger.LogInformation("Getting current weekly review for user {UserId}", userId);

        var weekId = GetCurrentWeekId();
        var review = await _reviewRepository.FindOneAsync(wr => wr.UserId == userId && wr.WeekId == weekId)
                     ?? await CreateDefaultAsync(userId, weekId);

        return _mapper.Map<WeeklyReviewDto>(review);
    }

    public async Task<WeeklyReviewDto> SubmitWeeklyReviewAsync(SubmitWeeklyReviewRequest request, string userId)
    {
        _logger.LogInformation("Submitting weekly review for user {UserId}", userId);

        var weekId = GetCurrentWeekId();
        var review = await _reviewRepository.FindOneAsync(wr => wr.UserId == userId && wr.WeekId == weekId)
                     ?? await CreateDefaultAsync(userId, weekId);

        review.Shipped = request.Shipped;
        review.Improved = request.Improved;
        review.Avoided = request.Avoided;
        review.NextFocus = request.NextFocus;
        review.Completed = true;
        review.CompletedAt = DateTime.UtcNow;

        await _reviewRepository.UpdateAsync(review);
        return _mapper.Map<WeeklyReviewDto>(review);
    }

    private async Task<WeeklyReviewEntity> CreateDefaultAsync(string userId, string weekId)
    {
        var review = new WeeklyReviewEntity
        {
            UserId = userId,
            WeekId = weekId,
            AiSummary = string.Empty,
            Completed = false,
        };
        return await _reviewRepository.CreateAsync(review);
    }

    private static string GetCurrentWeekId()
    {
        var now = DateTime.UtcNow;
        var weekOfYear = CultureInfo.CurrentCulture.Calendar.GetWeekOfYear(
            now, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
        return $"{now.Year}-{weekOfYear:D2}";
    }
}
