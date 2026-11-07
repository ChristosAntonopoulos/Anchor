using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Meals;
using POS.Core.Entities.Meals;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Meals;

public class InventoryService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<InventoryService> _logger;

    private static readonly int UseSoonDays = 3;

    public InventoryService(MongoDbContext context, ILogger<InventoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<InventoryListDto> GetInventoryAsync(string userId)
    {
        var filter = Builders<InventoryBatch>.Filter.And(
            Builders<InventoryBatch>.Filter.Eq(b => b.UserId, userId),
            Builders<InventoryBatch>.Filter.Eq(b => b.IsDiscarded, false),
            Builders<InventoryBatch>.Filter.Eq(b => b.IsConsumed, false),
            Builders<InventoryBatch>.Filter.Gt(b => b.CurrentAmount, 0m));

        var batches = await _context.InventoryBatches
            .Find(filter)
            .SortBy(b => b.PrintedDate)
            .ToListAsync();

        var now = DateTime.UtcNow.Date;
        var result = new InventoryListDto();

        foreach (var batch in batches)
        {
            var dto = MapToDto(batch);
            var isUseSoon = IsUseSoon(batch, now);

            if (isUseSoon)
                result.UseSoon.Add(dto);

            switch (batch.Location)
            {
                case StorageLocation.Fridge:
                    result.Fridge.Add(dto);
                    break;
                case StorageLocation.Freezer:
                    result.Freezer.Add(dto);
                    break;
                case StorageLocation.Cupboard:
                    result.Cupboard.Add(dto);
                    break;
            }
        }

        return result;
    }

    public async Task<InventoryBatchDto> AddBatchAsync(string userId, AddInventoryBatchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RawName))
            throw new ValidationException("rawName", "Product name is required.");

        if (request.Amount < 0)
            throw new ValidationException("amount", "Amount must be non-negative.");

        var batch = new InventoryBatch
        {
            UserId = userId,
            IngredientId = request.IngredientId,
            RawName = request.RawName.Trim(),
            Form = request.Form,
            CurrentAmount = request.Amount,
            Unit = request.Unit,
            AmountIsApproximate = request.AmountIsApproximate,
            PrintedDateText = request.PrintedDateText,
            PrintedDate = request.PrintedDate,
            LabelStorageInstructions = request.LabelStorageInstructions,
            Notes = request.Notes,
            PurchasedAt = request.PurchasedAt ?? DateTime.UtcNow,
            Confidence = DataConfidence.UserConfirmed,
        };

        if (Enum.TryParse<StorageLocation>(request.Location, out var loc))
            batch.Location = loc;

        if (Enum.TryParse<DateType>(request.DateType, out var dt))
            batch.DateType = dt;

        if (request.IsOpened == true)
            batch.OpenedAt = request.OpenedAt ?? DateTime.UtcNow;

        await _context.InventoryBatches.InsertOneAsync(batch);

        await RecordMovementAsync(userId, batch.Id, MovementKind.Purchased, batch.CurrentAmount, batch.Unit, null);

        _logger.LogInformation("Added inventory batch {BatchId} for user {UserId}: {Name}", batch.Id, userId, batch.RawName);
        return MapToDto(batch);
    }

    public async Task<InventoryBatchDto> UpdateBatchAsync(string userId, UpdateInventoryBatchRequest request)
    {
        var filter = Builders<InventoryBatch>.Filter.And(
            Builders<InventoryBatch>.Filter.Eq(b => b.Id, request.Id),
            Builders<InventoryBatch>.Filter.Eq(b => b.UserId, userId));

        var batch = await _context.InventoryBatches.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Inventory batch not found.");

        if (request.ExpectedVersion > 0 && batch.Version != request.ExpectedVersion)
            throw new BusinessException($"Version conflict: expected {request.ExpectedVersion}, current {batch.Version}");

        decimal? oldAmount = batch.CurrentAmount;

        if (request.CurrentAmount.HasValue) batch.CurrentAmount = request.CurrentAmount.Value;
        if (request.AmountIsApproximate.HasValue) batch.AmountIsApproximate = request.AmountIsApproximate.Value;
        if (request.Location != null && Enum.TryParse<StorageLocation>(request.Location, out var loc)) batch.Location = loc;
        if (request.DateType != null && Enum.TryParse<DateType>(request.DateType, out var dt)) batch.DateType = dt;
        if (request.PrintedDate.HasValue) batch.PrintedDate = request.PrintedDate;
        if (request.PrintedDateText != null) batch.PrintedDateText = request.PrintedDateText;
        if (request.OpenedAt.HasValue) batch.OpenedAt = request.OpenedAt;
        if (request.Notes != null) batch.Notes = request.Notes;

        batch.Version++;
        batch.UpdatedAt = DateTime.UtcNow;

        await _context.InventoryBatches.ReplaceOneAsync(filter, batch);

        if (request.CurrentAmount.HasValue && request.CurrentAmount.Value != oldAmount)
        {
            var delta = request.CurrentAmount.Value - (oldAmount ?? 0);
            await RecordMovementAsync(userId, batch.Id, MovementKind.Correction, delta, batch.Unit, null);
        }

        return MapToDto(batch);
    }

    public async Task DiscardBatchAsync(string userId, DiscardBatchRequest request)
    {
        var filter = Builders<InventoryBatch>.Filter.And(
            Builders<InventoryBatch>.Filter.Eq(b => b.Id, request.Id),
            Builders<InventoryBatch>.Filter.Eq(b => b.UserId, userId));

        var batch = await _context.InventoryBatches.Find(filter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Inventory batch not found.");

        var update = Builders<InventoryBatch>.Update
            .Set(b => b.IsDiscarded, true)
            .Set(b => b.UpdatedAt, DateTime.UtcNow);

        await _context.InventoryBatches.UpdateOneAsync(filter, update);
        await RecordMovementAsync(userId, batch.Id, MovementKind.Discarded, -batch.CurrentAmount, batch.Unit, request.Reason);

        _logger.LogInformation("Discarded batch {BatchId} for user {UserId}", batch.Id, userId);
    }

    private async Task RecordMovementAsync(string userId, string batchId, MovementKind kind, decimal delta, string unit, string? note)
    {
        var movement = new InventoryMovement
        {
            UserId = userId,
            BatchId = batchId,
            Kind = kind,
            AmountDelta = delta,
            Unit = unit,
            Note = note,
            OccurredAt = DateTime.UtcNow,
        };
        await _context.InventoryMovements.InsertOneAsync(movement);
    }

    private static bool IsUseSoon(InventoryBatch batch, DateTime now)
    {
        if (batch.DateType == DateType.UseBy && batch.PrintedDate.HasValue)
        {
            var daysLeft = (batch.PrintedDate.Value.Date - now).TotalDays;
            return daysLeft <= UseSoonDays && daysLeft >= 0;
        }
        return false;
    }

    private static InventoryBatchDto MapToDto(InventoryBatch batch) => new()
    {
        Id = batch.Id,
        IngredientId = batch.IngredientId,
        RawName = batch.RawName,
        Form = batch.Form,
        CurrentAmount = batch.CurrentAmount,
        Unit = batch.Unit,
        AmountIsApproximate = batch.AmountIsApproximate,
        Location = batch.Location.ToString(),
        PrintedDateText = batch.PrintedDateText,
        PrintedDate = batch.PrintedDate,
        DateType = batch.DateType.ToString(),
        OpenedAt = batch.OpenedAt,
        FrozenAt = batch.FrozenAt,
        ThawedAt = batch.ThawedAt,
        PurchasedAt = batch.PurchasedAt,
        LabelStorageInstructions = batch.LabelStorageInstructions,
        IsDiscarded = batch.IsDiscarded,
        IsConsumed = batch.IsConsumed,
        Confidence = batch.Confidence.ToString(),
        Notes = batch.Notes,
        CreatedAt = batch.CreatedAt,
        Version = batch.Version,
    };
}
