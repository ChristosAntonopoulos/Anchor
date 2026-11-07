using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Core.Entities.Schedule;
using POS.Core.Schedule;
using POS.Infrastructure.Services;
using POS.Infrastructure.Data;

namespace POS.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds schedule block definitions (templates) and materializes today's instances.
/// </summary>
public class ScheduleSeeder
{
    private readonly MongoDbContext _context;
    private readonly ScheduleMaterializationService _materialization;
    private readonly ILogger<ScheduleSeeder> _logger;

    public ScheduleSeeder(
        MongoDbContext context,
        ScheduleMaterializationService materialization,
        ILogger<ScheduleSeeder> logger)
    {
        _context = context;
        _materialization = materialization;
        _logger = logger;
    }

    public async Task SeedAsync(string userId)
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation("Seeding schedule for user {UserId} on {Date}", userId, today);

        await _materialization.EnsureDefaultDefinitionsAsync(userId);
        await _materialization.MaterializeForDateAsync(userId, today);

        var filter = Builders<ScheduleBlockInstance>.Filter.And(
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.UserId, userId),
            Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Date, today));

        var blocks = await _context.ScheduleBlockInstances.Find(filter).ToListAsync();
        foreach (var block in blocks)
        {
            if (block.ChecklistItems is { Count: > 0 })
                continue;

            block.ChecklistItems = ScheduleChecklistBuilder.BuildForBlock(block);
            block.ChecklistVersion = ScheduleChecklistBuilder.CurrentChecklistVersion;
            await _context.ScheduleBlockInstances.ReplaceOneAsync(
                Builders<ScheduleBlockInstance>.Filter.Eq(sb => sb.Id, block.Id),
                block);
        }

        _logger.LogInformation("Schedule seed complete: {Count} instances for today", blocks.Count);
    }
}
