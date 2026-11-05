using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Notifications;
using POS.Core.Entities.Notifications;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Notifications;

/// <summary>
/// Service for managing notifications
/// </summary>
public class NotificationService
{
    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(MongoDbContext context, IMapper mapper, ILogger<NotificationService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Create a notification
    /// </summary>
    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationRequest request, string userId)
    {
        _logger.LogInformation("Creating notification for user {UserId}", userId);

        var notification = _mapper.Map<Notification>(request);
        notification.UserId = userId;
        notification.IsDismissed = false;
        notification.IsRead = false;
        notification.IsIgnored = false;
        notification.CreatedAt = DateTime.UtcNow;
        notification.UpdatedAt = DateTime.UtcNow;

        await _context.Notifications.InsertOneAsync(notification);
        return _mapper.Map<NotificationDto>(notification);
    }

    /// <summary>
    /// Get notifications with filtering, grouping, and pagination
    /// </summary>
    public async Task<(List<NotificationDto> Notifications, int TotalCount)> GetNotificationsAsync(
        string userId,
        string? groupBy = null,
        string? filter = null,
        string? search = null,
        int page = 1,
        int limit = 50)
    {
        _logger.LogInformation("Getting notifications for user {UserId} with filters", userId);

        var filterBuilder = Builders<Notification>.Filter;
        var filters = new List<FilterDefinition<Notification>>
        {
            filterBuilder.Eq(n => n.UserId, userId)
        };

        // Apply filters
        if (!string.IsNullOrEmpty(filter))
        {
            switch (filter.ToLower())
            {
                case "task-relevant":
                    filters.Add(filterBuilder.Eq(n => n.IsTaskRelevant, true));
                    break;
                case "unread":
                    filters.Add(filterBuilder.Eq(n => n.IsRead, false));
                    break;
                case "dismissed":
                    filters.Add(filterBuilder.Eq(n => n.IsDismissed, true));
                    break;
            }
        }

        // Apply search
        if (!string.IsNullOrEmpty(search))
        {
            var searchFilter = filterBuilder.Or(
                filterBuilder.Regex(n => n.Title, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                filterBuilder.Regex(n => n.Text, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                filterBuilder.Regex(n => n.AppName, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filters.Add(searchFilter);
        }

        var combinedFilter = filterBuilder.And(filters);
        var sort = Builders<Notification>.Sort.Descending(n => n.PostTime);

        var totalCount = await _context.Notifications.CountDocumentsAsync(combinedFilter);
        var notifications = await _context.Notifications
            .Find(combinedFilter)
            .Sort(sort)
            .Skip((page - 1) * limit)
            .Limit(limit)
            .ToListAsync();

        return (_mapper.Map<List<NotificationDto>>(notifications), (int)totalCount);
    }

    /// <summary>
    /// Get a single notification
    /// </summary>
    public async Task<NotificationDto> GetNotificationAsync(string id, string userId)
    {
        _logger.LogInformation("Getting notification {NotificationId} for user {UserId}", id, userId);

        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.Id, id),
            Builders<Notification>.Filter.Eq(n => n.UserId, userId)
        );

        var notification = await _context.Notifications.Find(filter).FirstOrDefaultAsync();
        if (notification == null)
        {
            throw new NotFoundException("Notification", id);
        }

        return _mapper.Map<NotificationDto>(notification);
    }

    /// <summary>
    /// Update a notification (mark read/dismissed)
    /// </summary>
    public async Task<NotificationDto> UpdateNotificationAsync(string id, UpdateNotificationRequest request, string userId)
    {
        _logger.LogInformation("Updating notification {NotificationId} for user {UserId}", id, userId);

        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.Id, id),
            Builders<Notification>.Filter.Eq(n => n.UserId, userId)
        );

        var updateBuilder = Builders<Notification>.Update;
        var updates = new List<UpdateDefinition<Notification>>();

        if (request.IsDismissed.HasValue)
        {
            updates.Add(updateBuilder.Set(n => n.IsDismissed, request.IsDismissed.Value));
        }

        if (request.IsRead.HasValue)
        {
            updates.Add(updateBuilder.Set(n => n.IsRead, request.IsRead.Value));
        }

        if (request.IsIgnored.HasValue)
        {
            updates.Add(updateBuilder.Set(n => n.IsIgnored, request.IsIgnored.Value));
        }

        if (updates.Count > 0)
        {
            updates.Add(updateBuilder.Set(n => n.UpdatedAt, DateTime.UtcNow));
            var update = updateBuilder.Combine(updates);

            var result = await _context.Notifications.UpdateOneAsync(filter, update);
            if (result.MatchedCount == 0)
            {
                throw new NotFoundException("Notification", id);
            }
        }

        return await GetNotificationAsync(id, userId);
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    public async Task DeleteNotificationAsync(string id, string userId)
    {
        _logger.LogInformation("Deleting notification {NotificationId} for user {UserId}", id, userId);

        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.Id, id),
            Builders<Notification>.Filter.Eq(n => n.UserId, userId)
        );

        var result = await _context.Notifications.DeleteOneAsync(filter);
        if (result.DeletedCount == 0)
        {
            throw new NotFoundException("Notification", id);
        }
    }

    /// <summary>
    /// Get notification insights
    /// </summary>
    public async Task<NotificationInsightsDto> GetNotificationInsightsAsync(string userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        _logger.LogInformation("Getting notification insights for user {UserId}", userId);

        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.UserId, userId),
            Builders<Notification>.Filter.Gte(n => n.PostTime, start),
            Builders<Notification>.Filter.Lte(n => n.PostTime, end)
        );

        var notifications = await _context.Notifications.Find(filter).ToListAsync();

        var insights = new NotificationInsightsDto
        {
            TotalNotifications = notifications.Count,
            TaskRelevantCount = notifications.Count(n => n.IsTaskRelevant)
        };

        // Most active apps
        var appGroups = notifications
            .Where(n => !string.IsNullOrEmpty(n.PackageName))
            .GroupBy(n => n.PackageName)
            .Select(g => new AppNotificationCount
            {
                PackageName = g.Key,
                AppName = g.First().AppName,
                Count = g.Count()
            })
            .OrderByDescending(a => a.Count)
            .Take(10)
            .ToList();

        insights.MostActiveApps = appGroups;

        // Notifications by hour
        var hourGroups = notifications
            .GroupBy(n => n.PostTime.Hour)
            .Select(g => new TimeSlotCount
            {
                Hour = g.Key,
                Count = g.Count()
            })
            .OrderBy(h => h.Hour)
            .ToList();

        insights.NotificationsByHour = hourGroups;

        // Notifications by day of week
        var dayNames = new[] { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
        var dayGroups = notifications
            .GroupBy(n => (int)n.PostTime.DayOfWeek)
            .Select(g => new DayOfWeekCount
            {
                DayOfWeek = g.Key,
                DayName = dayNames[g.Key],
                Count = g.Count()
            })
            .OrderBy(d => d.DayOfWeek)
            .ToList();

        insights.NotificationsByDay = dayGroups;

        return insights;
    }

    /// <summary>
    /// Get notification settings
    /// </summary>
    public async Task<NotificationSettingsDto> GetNotificationSettingsAsync(string userId)
    {
        _logger.LogInformation("Getting notification settings for user {UserId}", userId);

        var filter = Builders<NotificationSettings>.Filter.Eq(s => s.UserId, userId);
        var settings = await _context.NotificationSettings.Find(filter).FirstOrDefaultAsync();

        if (settings == null)
        {
            // Create default settings
            settings = new NotificationSettings
            {
                UserId = userId,
                WhitelistedApps = new List<string>(),
                BlacklistedApps = new List<string>(),
                AutoSubmitEnabled = false,
                RetentionDays = 30,
                CustomKeywords = new List<string>(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.NotificationSettings.InsertOneAsync(settings);
        }

        return _mapper.Map<NotificationSettingsDto>(settings);
    }

    /// <summary>
    /// Update notification settings
    /// </summary>
    public async Task<NotificationSettingsDto> UpdateNotificationSettingsAsync(UpdateNotificationSettingsRequest request, string userId)
    {
        _logger.LogInformation("Updating notification settings for user {UserId}", userId);

        var filter = Builders<NotificationSettings>.Filter.Eq(s => s.UserId, userId);
        var existing = await _context.NotificationSettings.Find(filter).FirstOrDefaultAsync();

        if (existing == null)
        {
            existing = new NotificationSettings
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
        }

        if (request.WhitelistedApps != null)
        {
            existing.WhitelistedApps = request.WhitelistedApps;
        }

        if (request.BlacklistedApps != null)
        {
            existing.BlacklistedApps = request.BlacklistedApps;
        }

        if (request.AutoSubmitEnabled.HasValue)
        {
            existing.AutoSubmitEnabled = request.AutoSubmitEnabled.Value;
        }

        if (request.RetentionDays.HasValue)
        {
            existing.RetentionDays = request.RetentionDays.Value;
        }

        if (request.CustomKeywords != null)
        {
            existing.CustomKeywords = request.CustomKeywords;
        }

        existing.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrEmpty(existing.Id))
        {
            await _context.NotificationSettings.InsertOneAsync(existing);
        }
        else
        {
            await _context.NotificationSettings.ReplaceOneAsync(filter, existing);
        }

        return _mapper.Map<NotificationSettingsDto>(existing);
    }

    /// <summary>
    /// Get list of unique apps from notifications
    /// </summary>
    public async Task<List<AppNotificationCount>> GetAppListAsync(string userId)
    {
        _logger.LogInformation("Getting app list for user {UserId}", userId);

        var filter = Builders<Notification>.Filter.Eq(n => n.UserId, userId);
        var notifications = await _context.Notifications.Find(filter).ToListAsync();

        var appGroups = notifications
            .Where(n => !string.IsNullOrEmpty(n.PackageName))
            .GroupBy(n => n.PackageName)
            .Select(g => new AppNotificationCount
            {
                PackageName = g.Key,
                AppName = g.First().AppName,
                Count = g.Count()
            })
            .OrderBy(a => a.AppName ?? a.PackageName)
            .ToList();

        return appGroups;
    }
}
