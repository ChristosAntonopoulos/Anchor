using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using POS.Application.DTOs.Meals;
using POS.Core.Entities.Meals;
using POS.Core.Exceptions;
using POS.Infrastructure.Data;

namespace POS.Application.Services.Meals;

public class RecipeService
{
    private readonly MongoDbContext _context;
    private readonly RecipeGenerationService _generator;
    private readonly ILogger<RecipeService> _logger;

    public RecipeService(
        MongoDbContext context,
        RecipeGenerationService generator,
        ILogger<RecipeService> logger)
    {
        _context = context;
        _generator = generator;
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
        if (!ObjectId.TryParse(id, out _))
            return null;

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

    public async Task<RecipeVersionDto> GenerateRecipeAsync(string userId, GenerateRecipeRequest request)
    {
        var built = await _generator.BuildAsync(request.Name, request.Servings);
        return await CreateRecipeAsync(userId, built);
    }

    public async Task<CookReadyDto> EnsureSlotRecipeAsync(string userId, string planId, string slotId)
    {
        var planFilter = Builders<MealPlan>.Filter.And(
            Builders<MealPlan>.Filter.Eq(p => p.Id, planId),
            Builders<MealPlan>.Filter.Eq(p => p.UserId, userId));
        var plan = await _context.MealPlans.Find(planFilter).FirstOrDefaultAsync()
            ?? throw new NotFoundException("Meal plan not found.");

        var slot = plan.Slots.FirstOrDefault(s => s.Id == slotId)
            ?? throw new NotFoundException("Meal slot not found.");

        RecipeVersionDto? recipe = null;
        if (ObjectId.TryParse(slot.RecipeVersionId, out _))
            recipe = await GetRecipeByIdAsync(slot.RecipeVersionId!, userId);

        if (recipe == null || !RecipeGenerationService.HasUsableSteps(recipe))
        {
            var dish = string.IsNullOrWhiteSpace(slot.RecipeName) ? slot.Slot.ToString() : slot.RecipeName;
            var built = await _generator.BuildAsync(dish, slot.Servings);
            recipe = await CreateRecipeAsync(userId, built);

            slot.RecipeVersionId = recipe.Id;
            slot.RecipeName = recipe.NameEl;
            slot.HandsonMinutes = recipe.HandsonMinutes;
            slot.TotalMinutes = recipe.TotalMinutes;
            plan.UpdatedAt = DateTime.UtcNow;
            plan.Version++;
            await _context.MealPlans.ReplaceOneAsync(planFilter, plan);
        }

        return new CookReadyDto
        {
            PlanId = plan.Id,
            Slot = MapSlot(slot),
            Recipe = recipe
        };
    }

    public async Task<List<RecipeVersionDto>> GetAlternativesAsync(string userId, string? excludeRecipeId)
    {
        var recipes = await GetUserRecipesAsync(userId);
        var list = recipes
            .Where(r => r.Id != excludeRecipeId && RecipeGenerationService.HasUsableSteps(r))
            .Take(20)
            .ToList();

        if (list.Count > 0)
            return list;

        foreach (var name in new[] { "Μακαρόνια με σάλτσα", "Κοτόπουλο λεμονάτο", "Ρύζι με λαχανικά" })
            list.Add(await GenerateRecipeAsync(userId, new GenerateRecipeRequest { Name = name, Servings = 2 }));

        return list;
    }

    private static MealSlotDto MapSlot(MealSlot slot) => new()
    {
        Id = slot.Id,
        LocalDate = slot.LocalDate,
        Slot = slot.Slot.ToString(),
        Kind = slot.Kind.ToString(),
        RecipeVersionId = slot.RecipeVersionId,
        RecipeName = slot.RecipeName,
        Servings = slot.Servings,
        Locked = slot.Locked,
        SourceMealSlotId = slot.SourceMealSlotId,
        ReasonSummary = slot.ReasonSummary,
        HandsonMinutes = slot.HandsonMinutes,
        TotalMinutes = slot.TotalMinutes,
        State = slot.State.ToString(),
        CookEventId = slot.CookEventId,
    };

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
