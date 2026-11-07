using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs.Meals;
using POS.Application.Services.Meals;

namespace POS.Api.Controllers;

[Route("api/meals")]
public class MealsController : BaseController
{
    private readonly MealProfileService _profileService;
    private readonly InventoryService _inventoryService;
    private readonly MealPlanService _planService;
    private readonly RecipeService _recipeService;
    private readonly ShoppingService _shoppingService;
    private readonly CookEventService _cookEventService;

    public MealsController(
        MealProfileService profileService,
        InventoryService inventoryService,
        MealPlanService planService,
        RecipeService recipeService,
        ShoppingService shoppingService,
        CookEventService cookEventService)
    {
        _profileService = profileService;
        _inventoryService = inventoryService;
        _planService = planService;
        _recipeService = recipeService;
        _shoppingService = shoppingService;
        _cookEventService = cookEventService;
    }

    // ── Profile ──────────────────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await _profileService.GetOrCreateProfileAsync(GetUserId());
        return Success(profile);
    }

    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateFoodProfileRequest request)
    {
        var profile = await _profileService.UpdateProfileAsync(GetUserId(), request);
        return Success(profile, "Profile updated");
    }

    // ── Inventory ─────────────────────────────────────────────────────────────

    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventory()
    {
        var inventory = await _inventoryService.GetInventoryAsync(GetUserId());
        return Success(inventory);
    }

    [HttpPost("inventory")]
    public async Task<IActionResult> AddBatch([FromBody] AddInventoryBatchRequest request)
    {
        var batch = await _inventoryService.AddBatchAsync(GetUserId(), request);
        return CreatedSuccess(batch, "Item added");
    }

    [HttpPatch("inventory/{id}")]
    public async Task<IActionResult> UpdateBatch(string id, [FromBody] UpdateInventoryBatchRequest request)
    {
        request.Id = id;
        var batch = await _inventoryService.UpdateBatchAsync(GetUserId(), request);
        return Success(batch, "Item updated");
    }

    [HttpPost("inventory/{id}/discard")]
    public async Task<IActionResult> DiscardBatch(string id, [FromBody] DiscardBatchRequest request)
    {
        request.Id = id;
        await _inventoryService.DiscardBatchAsync(GetUserId(), request);
        return Success("Item discarded");
    }

    // ── Recipes ────────────────────────────────────────────────────────────────

    [HttpGet("recipes")]
    public async Task<IActionResult> GetRecipes()
    {
        var recipes = await _recipeService.GetUserRecipesAsync(GetUserId());
        return Success(recipes);
    }

    [HttpGet("recipes/alternatives")]
    public async Task<IActionResult> GetAlternatives([FromQuery] string? excludeId)
    {
        var recipes = await _recipeService.GetAlternativesAsync(GetUserId(), excludeId);
        return Success(recipes);
    }

    [HttpGet("recipes/{id}")]
    public async Task<IActionResult> GetRecipe(string id)
    {
        var recipe = await _recipeService.GetRecipeByIdAsync(id, GetUserId());
        if (recipe == null) return NotFound("Recipe not found");
        return Success(recipe);
    }

    [HttpPost("recipes")]
    public async Task<IActionResult> CreateRecipe([FromBody] CreateRecipeRequest request)
    {
        var recipe = await _recipeService.CreateRecipeAsync(GetUserId(), request);
        return CreatedSuccess(recipe, "Recipe created");
    }

    [HttpPost("recipes/generate")]
    public async Task<IActionResult> GenerateRecipe([FromBody] GenerateRecipeRequest request)
    {
        var recipe = await _recipeService.GenerateRecipeAsync(GetUserId(), request);
        return CreatedSuccess(recipe, "Recipe generated");
    }

    [HttpPost("plans/{planId}/slots/{slotId}/cook-ready")]
    public async Task<IActionResult> CookReady(string planId, string slotId)
    {
        var ready = await _recipeService.EnsureSlotRecipeAsync(GetUserId(), planId, slotId);
        return Success(ready);
    }

    // ── Meal Plans ──────────────────────────────────────────────────────────────

    [HttpGet("plans/active")]
    public async Task<IActionResult> GetActivePlan()
    {
        var plan = await _planService.GetActivePlanAsync(GetUserId());
        if (plan == null) return Success<MealPlanDto?>(null, "No active plan");
        return Success(plan);
    }

    [HttpPost("plans/ensure-week")]
    public async Task<IActionResult> EnsureWeek()
    {
        var plan = await _planService.EnsureCurrentWeekAsync(GetUserId());
        return Success(plan, "Current week initialized");
    }

    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan([FromBody] CreateMealPlanRequest request)
    {
        var plan = await _planService.CreatePlanAsync(GetUserId(), request);
        return CreatedSuccess(plan, "Plan created");
    }

    [HttpPost("plans/{id}/activate")]
    public async Task<IActionResult> ActivatePlan(string id)
    {
        var plan = await _planService.ActivatePlanAsync(GetUserId(), id);
        return Success(plan, "Plan activated");
    }

    [HttpPatch("plans/{id}/slots/{slotId}")]
    public async Task<IActionResult> UpdateSlot(string id, string slotId, [FromBody] UpdateMealSlotRequest request)
    {
        request.SlotId = slotId;
        var plan = await _planService.UpdateSlotAsync(GetUserId(), id, request);
        return Success(plan, "Slot updated");
    }

    [HttpGet("today-card")]
    public async Task<IActionResult> GetTodayCard()
    {
        var card = await _planService.GetTodayCardAsync(GetUserId());
        return Success(card);
    }

    // ── Shopping ────────────────────────────────────────────────────────────────

    [HttpGet("plans/{planId}/shopping")]
    public async Task<IActionResult> GetShoppingTrip(string planId)
    {
        var trip = await _shoppingService.GetActiveTripAsync(GetUserId(), planId);
        if (trip == null) return Success<ShoppingTripDto?>(null, "No active shopping trip");
        return Success(trip);
    }

    [HttpPost("plans/{planId}/shopping/generate")]
    public async Task<IActionResult> GenerateShoppingTrip(string planId)
    {
        var trip = await _shoppingService.GenerateTripAsync(GetUserId(), planId);
        return CreatedSuccess(trip, "Shopping list generated");
    }

    [HttpPatch("shopping/{tripId}/lines/{lineId}")]
    public async Task<IActionResult> UpdateShoppingLine(string tripId, string lineId, [FromBody] UpdateShoppingLineRequest request)
    {
        request.LineId = lineId;
        await _shoppingService.UpdateLineAsync(GetUserId(), tripId, request);
        return Success("Line updated");
    }

    [HttpPost("shopping/finish")]
    public async Task<IActionResult> FinishShopping([FromBody] FinishShoppingRequest request)
    {
        await _shoppingService.FinishTripAsync(GetUserId(), request);
        return Success("Shopping trip completed and inventory updated");
    }

    // ── Cooking ────────────────────────────────────────────────────────────────

    [HttpPost("cooking/complete")]
    public async Task<IActionResult> CompleteCook([FromBody] CompleteCookRequest request)
    {
        var cookEvent = await _cookEventService.CompleteCookAsync(GetUserId(), request);
        return Success(cookEvent, "Cook event recorded");
    }
}
