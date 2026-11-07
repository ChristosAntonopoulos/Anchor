using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.Meals;
using POS.Core.Entities.Meals;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Meals;

public class RecipeService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<RecipeService> _logger;

    public RecipeService(MongoDbContext context, ILogger<RecipeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<RecipeVersionDto>> GetUserRecipesAsync(string userId)
    {
        var filter = Builders<RecipeVersion>.Filter.And(
            Builders<RecipeVersion>.Filter.Or(
                Builders<RecipeVersion>.Filter.Eq(r => r.UserId, userId),
                Builders<RecipeVersion>.Filter.Eq(r => r.UserId, "system")),
            Builders<RecipeVersion>.Filter.Eq(r => r.IsActive, true));

        var recipes = await _context.RecipeVersions.Find(filter)
            .SortByDescending(r => r.CreatedAt)
            .ToListAsync();

        return recipes.Select(MapToDto).ToList();
    }

    public async Task<RecipeVersionDto?> GetRecipeByIdAsync(string id, string userId)
    {
        var filter = Builders<RecipeVersion>.Filter.And(
            Builders<RecipeVersion>.Filter.Eq(r => r.Id, id),
            Builders<RecipeVersion>.Filter.Or(
                Builders<RecipeVersion>.Filter.Eq(r => r.UserId, userId),
                Builders<RecipeVersion>.Filter.Eq(r => r.UserId, "system")));

        var recipe = await _context.RecipeVersions.Find(filter).FirstOrDefaultAsync();
        return recipe == null ? null : MapToDto(recipe);
    }

    public async Task<RecipeVersionDto> CreateRecipeAsync(string userId, CreateRecipeRequest request)
    {
        var recipeId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();

        var recipe = new RecipeVersion
        {
            UserId = userId,
            RecipeId = recipeId,
            VersionNumber = 1,
            NameEl = request.NameEl,
            NameEn = request.NameEn,
            SourceKind = RecipeSourceKind.AiGenerated,
            YieldServings = request.YieldServings,
            Ingredients = request.Ingredients.Select(i => new RecipeIngredient
            {
                IngredientId = i.IngredientId,
                RawName = i.RawName,
                Form = i.Form,
                Amount = i.Amount,
                Unit = i.Unit,
                QualitativeAmount = i.QualitativeAmount,
                IsOptional = i.IsOptional,
                AllergenFlags = i.AllergenFlags,
            }).ToList(),
            Steps = request.Steps.Select(s => new RecipeStep
            {
                StepNumber = s.StepNumber,
                Action = s.Action,
                DurationMinutes = s.DurationMinutes,
                IsActive = s.IsActive,
                DependsOnSteps = s.DependsOnSteps,
                Equipment = s.Equipment,
            }).ToList(),
            HandsonMinutes = request.HandsonMinutes,
            TotalMinutes = request.TotalMinutes,
            Equipment = request.Equipment,
            Tags = request.Tags,
            IsActive = true,
            ValidationStatus = "pending",
        };

        await _context.RecipeVersions.InsertOneAsync(recipe);
        _logger.LogInformation("Created recipe {RecipeId} for user {UserId}", recipe.RecipeId, userId);
        return MapToDto(recipe);
    }

    private static RecipeVersionDto MapToDto(RecipeVersion rv) => new()
    {
        Id = rv.Id,
        RecipeId = rv.RecipeId,
        VersionNumber = rv.VersionNumber,
        NameEl = rv.NameEl,
        NameEn = rv.NameEn,
        SourceKind = rv.SourceKind.ToString(),
        SourceUrl = rv.SourceUrl,
        SourceAttribution = rv.SourceAttribution,
        YieldServings = rv.YieldServings,
        Ingredients = rv.Ingredients.Select(i => new RecipeIngredientDto
        {
            IngredientId = i.IngredientId,
            RawName = i.RawName,
            Form = i.Form,
            Amount = i.Amount,
            Unit = i.Unit,
            QualitativeAmount = i.QualitativeAmount,
            IsOptional = i.IsOptional,
            AllergenFlags = i.AllergenFlags,
        }).ToList(),
        Steps = rv.Steps.Select(s => new RecipeStepDto
        {
            StepNumber = s.StepNumber,
            Action = s.Action,
            DurationMinutes = s.DurationMinutes,
            IsActive = s.IsActive,
            DependsOnSteps = s.DependsOnSteps,
            Equipment = s.Equipment,
        }).ToList(),
        HandsonMinutes = rv.HandsonMinutes,
        TotalMinutes = rv.TotalMinutes,
        Equipment = rv.Equipment,
        Tags = rv.Tags,
        ValidationStatus = rv.ValidationStatus,
    };
}
