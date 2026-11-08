using System.Text.Json;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Meals;
using POS.Application.Services.Execution;
using POS.Core.Entities.Meals;
using POS.Core.Exceptions;

namespace POS.Application.Services.Meals;

/// <summary>
/// Builds a cookable recipe with ingredients, timed steps, and parallel timers.
/// Uses the language model when configured, otherwise a structured catalog.
/// </summary>
public class RecipeGenerationService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly ILanguageModelClient _model;
    private readonly ILogger<RecipeGenerationService> _logger;

    public RecipeGenerationService(ILanguageModelClient model, ILogger<RecipeGenerationService> logger)
    {
        _model = model;
        _logger = logger;
    }

    public async Task<CreateRecipeRequest> BuildAsync(
        string dishName,
        int servings,
        MealKind kind = MealKind.FreshCook,
        CancellationToken ct = default)
    {
        servings = servings <= 0 ? 2 : servings;
        if (string.IsNullOrWhiteSpace(dishName))
            throw new ValidationException("name", "Recipe name is required.");
        var name = dishName.Trim();

        if (kind == MealKind.EatingOut)
            return Catalog.EatingOut(name, servings);
        if (kind == MealKind.Leftovers)
            return Catalog.Reheat(name, servings);

        if (_model.IsConfigured && kind != MealKind.NoCook)
        {
            try
            {
                var json = await _model.CompleteJsonAsync(
                    "Return strict JSON only. No markdown. Cooking steps must be practical for a home cook.",
                    """
                    Create a complete home-cooking recipe. JSON shape:
                    {
                      "nameEl": "...",
                      "nameEn": "...",
                      "yieldServings": 2,
                      "handsonMinutes": 15,
                      "totalMinutes": 40,
                      "equipment": ["pot"],
                      "tags": ["weeknight"],
                      "ingredients": [{"rawName":"...","amount":1,"unit":"g","isOptional":false}],
                      "steps": [{
                        "stepNumber": 1,
                        "action": "English instruction, specific and short",
                        "durationMinutes": 8,
                        "isActive": true,
                        "dependsOnSteps": [],
                        "equipment": ["pot"]
                      }]
                    }
                    Rules:
                    - At least 4 steps, at least 2 with durationMinutes > 0.
                    - isActive=true means an unattended timer the cook watches (boil, simmer, bake, rest, soak).
                    - isActive=false means hands-on work; still set durationMinutes.
                    - Use dependsOnSteps so independent work can run in parallel (e.g. sauce while pasta water boils).
                    - Actions, ingredient names, and dish names in English. Realistic times. No empty ingredients.
                    - Never use a placeholder ingredient name like "main ingredient". Use the real food.
                    """,
                    JsonSerializer.Serialize(new { dishName = name, servings }),
                    ct);

                var parsed = TryParse(json);
                if (parsed != null && HasUsableSteps(parsed) && !HasPlaceholderIngredient(parsed))
                {
                    parsed.YieldServings = servings;
                    Normalize(parsed, name, servings);
                    return parsed;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI recipe generation failed for {Dish}", name);
            }
        }

        var fallback = Catalog.Match(name, servings, kind == MealKind.NoCook);
        Normalize(fallback, name, servings);
        return fallback;
    }

    public static bool HasUsableSteps(CreateRecipeRequest recipe) =>
        recipe.Steps.Count >= 2 && recipe.Steps.Any(s => (s.DurationMinutes ?? 0) > 0);

    public static bool HasUsableSteps(RecipeVersionDto recipe) =>
        recipe.Steps.Count >= 2 && recipe.Steps.Any(s => (s.DurationMinutes ?? 0) > 0);

    public static bool HasPlaceholderIngredient(CreateRecipeRequest recipe) =>
        recipe.Ingredients.Any(i => IsPlaceholderName(i.RawName));

    public static bool HasPlaceholderIngredient(RecipeVersionDto recipe) =>
        recipe.Ingredients.Any(i => IsPlaceholderName(i.RawName));

    public static bool IsPlaceholderName(string? rawName) =>
        string.Equals(rawName?.Trim(), "κύριο υλικό", StringComparison.OrdinalIgnoreCase)
        || string.Equals(rawName?.Trim(), "main ingredient", StringComparison.OrdinalIgnoreCase);

    public static bool IsGenericMealName(string? name) =>
        string.Equals(name?.Trim(), "Γεύμα της ημέρας", StringComparison.OrdinalIgnoreCase)
        || string.Equals(name?.Trim(), "Meal of the day", StringComparison.OrdinalIgnoreCase);

    private static CreateRecipeRequest? TryParse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;
        var trimmed = json.Trim();
        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');
        if (start < 0 || end <= start)
            return null;
        trimmed = trimmed[start..(end + 1)];
        try
        {
            return JsonSerializer.Deserialize<CreateRecipeRequest>(trimmed, JsonOpts);
        }
        catch
        {
            return null;
        }
    }

    private static void Normalize(CreateRecipeRequest recipe, string name, int servings)
    {
        if (string.IsNullOrWhiteSpace(recipe.NameEl))
            recipe.NameEl = name;
        if (string.IsNullOrWhiteSpace(recipe.NameEn))
            recipe.NameEn = name;
        recipe.YieldServings = servings;
        if (recipe.Steps.Count == 0)
            recipe.Steps = Catalog.GenericSteps();
        for (var i = 0; i < recipe.Steps.Count; i++)
        {
            if (recipe.Steps[i].StepNumber <= 0)
                recipe.Steps[i].StepNumber = i + 1;
            recipe.Steps[i].DependsOnSteps ??= new List<int>();
            recipe.Steps[i].Equipment ??= new List<string>();
        }
        if (recipe.HandsonMinutes <= 0)
            recipe.HandsonMinutes = recipe.Steps.Where(s => !s.IsActive).Sum(s => s.DurationMinutes ?? 3);
        if (recipe.TotalMinutes <= 0)
            recipe.TotalMinutes = Math.Max(recipe.HandsonMinutes, recipe.Steps.Sum(s => s.DurationMinutes ?? 0));
        recipe.Equipment ??= new List<string>();
        recipe.Tags ??= new List<string>();
        recipe.Ingredients ??= new List<RecipeIngredientDto>();
        foreach (var ingredient in recipe.Ingredients.Where(i => IsPlaceholderName(i.RawName)))
            ingredient.RawName = name;
    }

    private static class Catalog
    {
        public static CreateRecipeRequest Match(string name, int servings, bool noCook)
        {
            var key = name.ToLowerInvariant();
            if (ContainsAny(key, "φακ", "lentil"))
                return LentilSoup(name, servings);
            if (ContainsAny(key, "μακαρόν", "spaghetti", "pasta", "penne", "noodles"))
                return Pasta(name, servings);
            if (ContainsAny(key, "κοτόπουλ", "chicken"))
                return Chicken(name, servings);
            if (ContainsAny(key, "ρύζι", "rice"))
                return RiceBowl(name, servings);
            if (ContainsAny(key, "σαλάτ", "salad"))
                return Salad(name, servings);
            if (ContainsAny(key, "γιαούρτ", "yogurt", "yoghurt"))
                return Yogurt(name, servings);
            if (ContainsAny(key, "ομελέτ", "omelet", "omelette"))
                return Omelette(name, servings);
            if (ContainsAny(key, "αυγ", "egg", "μάτια"))
                return Eggs(name, servings);
            if (noCook || ContainsAny(key, "nocook", "χωρίς μαγείρεμα"))
                return NoCookPlate(name, servings);
            return Skillet(name, servings);
        }

        public static List<RecipeStepDto> GenericSteps() => Skillet("Meal", 2).Steps;

        private static bool ContainsAny(string key, params string[] parts) =>
            parts.Any(p => key.Contains(p, StringComparison.Ordinal));

        private static CreateRecipeRequest LentilSoup(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Lentil soup",
            YieldServings = servings,
            HandsonMinutes = 15,
            TotalMinutes = 50,
            Equipment = new() { "pot", "knife", "board" },
            Tags = new() { "soup", "weeknight" },
            Ingredients = new()
            {
                I("lentils", 250 * servings / 2m, "g"),
                I("onion", servings, "pcs"),
                I("carrot", servings, "pcs"),
                I("garlic", 2, "pcs"),
                I("bay leaf", 1, "pcs", true),
                I("olive oil", 2, "tbsp"),
                I("lemon", 1, "pcs"),
                I("salt", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Rinse the lentils until the water runs clear.", 3, false, Array.Empty<int>(), "bowl"),
                S(2, "Saute onion, carrot and garlic in olive oil.", 8, true, Array.Empty<int>(), "pot"),
                S(3, "Add lentils, water and bay leaf. Bring to a boil.", 10, true, new[] { 1, 2 }, "pot"),
                S(4, "Simmer until the lentils soften. Meanwhile plate up lemon.", 20, true, new[] { 3 }, "pot"),
                S(5, "Salt, lemon, taste and serve.", 4, false, new[] { 4 }),
            }
        };

        private static CreateRecipeRequest Pasta(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Pasta",
            YieldServings = servings,
            HandsonMinutes = 18,
            TotalMinutes = 30,
            Equipment = new() { "pot", "pan" },
            Tags = new() { "pasta", "parallel" },
            Ingredients = new()
            {
                I("pasta", 100 * servings, "g"),
                I("garlic", 2, "pcs"),
                I("tomato", 400, "g"),
                I("olive oil", 2, "tbsp"),
                I("basil", 1, "handful", true),
                I("salt", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Bring a large pot of salted water to a boil.", 8, true, Array.Empty<int>(), "pot"),
                S(2, "In the sauce pan, saute garlic and tomato. This can run while the water heats.", 12, true, Array.Empty<int>(), "pan"),
                S(3, "Boil the pasta al dente.", 10, true, new[] { 1 }, "pot"),
                S(4, "Drain, keep a little pasta water. Toss with sauce and basil, then serve.", 4, false, new[] { 2, 3 }),
            }
        };

        private static CreateRecipeRequest Chicken(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Chicken skillet",
            YieldServings = servings,
            HandsonMinutes = 20,
            TotalMinutes = 35,
            Equipment = new() { "pan", "board" },
            Tags = new() { "protein" },
            Ingredients = new()
            {
                I("chicken", 150 * servings, "g"),
                I("olive oil", 2, "tbsp"),
                I("lemon", 1, "pcs"),
                I("oregano", 1, "tsp"),
                I("salt", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Pat the chicken dry. Salt, oregano, lemon.", 5, false, Array.Empty<int>(), "board"),
                S(2, "Heat the pan with olive oil until it sizzles.", 3, true, Array.Empty<int>(), "pan"),
                S(3, "Sear the first side without moving it.", 7, true, new[] { 1, 2 }, "pan"),
                S(4, "Flip and cook until 74°C inside.", 8, true, new[] { 3 }, "pan"),
                S(5, "Rest 3 minutes and serve with lemon.", 3, true, new[] { 4 }),
            }
        };

        private static CreateRecipeRequest RiceBowl(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Rice bowl",
            YieldServings = servings,
            HandsonMinutes = 12,
            TotalMinutes = 25,
            Equipment = new() { "pot", "pan" },
            Tags = new() { "rice", "parallel" },
            Ingredients = new()
            {
                I("rice", 80 * servings, "g"),
                I("vegetables", 200, "g"),
                I("olive oil", 1, "tbsp"),
                I("salt", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Rinse the rice and cook it covered.", 12, true, Array.Empty<int>(), "pot"),
                S(2, "Saute the vegetables in another pan while the rice cooks.", 10, true, Array.Empty<int>(), "pan"),
                S(3, "Let the rice steam off the heat, still covered.", 5, true, new[] { 1 }, "pot"),
                S(4, "Toss rice with vegetables and serve.", 3, false, new[] { 2, 3 }),
            }
        };

        private static CreateRecipeRequest Salad(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Salad",
            YieldServings = servings,
            HandsonMinutes = 12,
            TotalMinutes = 12,
            Equipment = new() { "bowl", "board" },
            Tags = new() { "nocook" },
            Ingredients = new()
            {
                I("salad greens", 1, "bowl"),
                I("tomato", 150 * servings, "g"),
                I("cucumber", 1, "pcs"),
                I("olive oil", 2, "tbsp"),
                I("lemon", 1, "pcs"),
                I("salt", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Wash and cut the vegetables.", 6, false, Array.Empty<int>(), "board"),
                S(2, "Make a lemon-olive oil dressing.", 2, false, Array.Empty<int>(), "bowl"),
                S(3, "Toss, taste for salt, serve.", 2, false, new[] { 1, 2 }),
            }
        };

        private static CreateRecipeRequest Yogurt(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Yogurt honey",
            YieldServings = servings,
            HandsonMinutes = 5,
            TotalMinutes = 5,
            Equipment = new() { "bowl" },
            Tags = new() { "nocook", "breakfast" },
            Ingredients = new()
            {
                I("yogurt", 200 * servings, "g"),
                I("honey", 1 * servings, "tbsp"),
                I("walnuts", 1, "handful", true),
            },
            Steps = new()
            {
                S(1, "Spoon the yogurt into a bowl.", 1, false, Array.Empty<int>(), "bowl"),
                S(2, "Drizzle with honey.", 1, false, new[] { 1 }),
                S(3, "Add walnuts if you want and serve.", 1, false, new[] { 2 }),
            }
        };

        private static CreateRecipeRequest Eggs(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Fried eggs",
            YieldServings = servings,
            HandsonMinutes = 8,
            TotalMinutes = 10,
            Equipment = new() { "pan" },
            Tags = new() { "breakfast" },
            Ingredients = new()
            {
                I("eggs", 2 * servings, "pcs"),
                I("olive oil", 1, "tbsp"),
                I("salt", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Heat the pan with olive oil.", 2, true, Array.Empty<int>(), "pan"),
                S(2, "Crack the eggs into the pan.", 1, false, new[] { 1 }, "pan"),
                S(3, "Cook until the whites set.", 4, true, new[] { 2 }, "pan"),
                S(4, "Salt and serve.", 1, false, new[] { 3 }),
            }
        };

        private static CreateRecipeRequest Omelette(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Omelette",
            YieldServings = servings,
            HandsonMinutes = 10,
            TotalMinutes = 12,
            Equipment = new() { "pan", "bowl" },
            Tags = new() { "breakfast" },
            Ingredients = new()
            {
                I("eggs", 2 * servings, "pcs"),
                I("onion", 0.5m, "pcs"),
                I("olive oil", 1, "tbsp"),
                I("salt", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Beat the eggs with salt.", 2, false, Array.Empty<int>(), "bowl"),
                S(2, "Saute the onion in olive oil.", 3, true, Array.Empty<int>(), "pan"),
                S(3, "Pour in the eggs and fold the omelette.", 4, true, new[] { 1, 2 }, "pan"),
                S(4, "Serve hot.", 1, false, new[] { 3 }),
            }
        };

        public static CreateRecipeRequest NoCookPlate(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = name,
            YieldServings = servings,
            HandsonMinutes = 5,
            TotalMinutes = 5,
            Equipment = new() { "plate" },
            Tags = new() { "nocook" },
            Ingredients = new()
            {
                I(name, servings, "item"),
            },
            Steps = new()
            {
                S(1, $"Put {name} on the plate.", 3, false, Array.Empty<int>(), "plate"),
                S(2, "Taste for salt or honey if needed, then serve.", 2, false, new[] { 1 }),
            }
        };

        public static CreateRecipeRequest Reheat(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Leftovers",
            YieldServings = servings,
            HandsonMinutes = 5,
            TotalMinutes = 8,
            Equipment = new() { "pan" },
            Tags = new() { "leftovers" },
            Ingredients = new()
            {
                I(name, servings, "portions", true),
            },
            Steps = new()
            {
                S(1, "Take the leftovers out of the fridge.", 1, false, Array.Empty<int>()),
                S(2, "Warm on low heat until hot.", 5, true, new[] { 1 }, "pan"),
                S(3, "Taste and serve.", 2, false, new[] { 2 }),
            }
        };

        public static CreateRecipeRequest EatingOut(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = "Eating out",
            YieldServings = servings,
            HandsonMinutes = 0,
            TotalMinutes = 5,
            Equipment = new(),
            Tags = new() { "eating-out" },
            Ingredients = new(),
            Steps = new()
            {
                S(1, "Note where you will eat out.", 2, false, Array.Empty<int>()),
                S(2, "No stove at home for this meal.", 1, false, new[] { 1 }),
            }
        };

        private static CreateRecipeRequest Skillet(string name, int servings) => new()
        {
            NameEl = name,
            NameEn = name,
            YieldServings = servings,
            HandsonMinutes = 18,
            TotalMinutes = 30,
            Equipment = new() { "pan", "board" },
            Tags = new() { "weeknight" },
            Ingredients = new()
            {
                I(name, 250 * servings / 2m, "g"),
                I("onion", 1, "pcs"),
                I("olive oil", 2, "tbsp"),
                I("salt", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Cut everything and set it by the stove.", 6, false, Array.Empty<int>(), "board"),
                S(2, "Heat the pan with olive oil.", 2, true, Array.Empty<int>(), "pan"),
                S(3, "Saute the onion until glossy.", 5, true, new[] { 1, 2 }, "pan"),
                S(4, $"Add {name} and cook until done.", 12, true, new[] { 3 }, "pan"),
                S(5, "Fix the salt and serve.", 3, false, new[] { 4 }),
            }
        };

        private static RecipeIngredientDto I(string raw, decimal amount, string unit, bool optional = false) => new()
        {
            RawName = raw,
            Amount = amount,
            Unit = unit,
            IsOptional = optional,
            AllergenFlags = new List<string>()
        };

        private static RecipeStepDto S(int n, string action, int minutes, bool timer, int[] depends, string? equipment = null) => new()
        {
            StepNumber = n,
            Action = action,
            DurationMinutes = minutes,
            IsActive = timer,
            DependsOnSteps = depends.ToList(),
            Equipment = string.IsNullOrEmpty(equipment) ? new List<string>() : new List<string> { equipment }
        };
    }
}
