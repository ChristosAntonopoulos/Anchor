using System.Text.Json;
using Microsoft.Extensions.Logging;
using POS.Application.DTOs.Meals;
using POS.Application.Services.Execution;

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

    public async Task<CreateRecipeRequest> BuildAsync(string dishName, int servings, CancellationToken ct = default)
    {
        servings = servings <= 0 ? 2 : servings;
        var name = string.IsNullOrWhiteSpace(dishName) ? "Γεύμα της ημέρας" : dishName.Trim();

        if (_model.IsConfigured)
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
                        "action": "Greek instruction, specific and short",
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
                    - Actions in Greek. Realistic times. No empty ingredients.
                    """,
                    JsonSerializer.Serialize(new { dishName = name, servings }),
                    ct);

                var parsed = TryParse(json);
                if (parsed != null && HasUsableSteps(parsed))
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

        var fallback = Catalog.Match(name, servings);
        Normalize(fallback, name, servings);
        return fallback;
    }

    public static bool HasUsableSteps(CreateRecipeRequest recipe) =>
        recipe.Steps.Count >= 2 && recipe.Steps.Any(s => (s.DurationMinutes ?? 0) > 0);

    public static bool HasUsableSteps(RecipeVersionDto recipe) =>
        recipe.Steps.Count >= 2 && recipe.Steps.Any(s => (s.DurationMinutes ?? 0) > 0);

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
    }

    private static class Catalog
    {
        public static CreateRecipeRequest Match(string name, int servings)
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
            return Skillet(name, servings);
        }

        public static List<RecipeStepDto> GenericSteps() => Skillet("Γεύμα", 2).Steps;

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
                I("φακές", 250 * servings / 2m, "g"),
                I("κρεμμύδι", servings, "pcs"),
                I("καρότο", servings, "pcs"),
                I("σκόρδο", 2, "pcs"),
                I("δάφνη", 1, "pcs", true),
                I("ελαιόλαδο", 2, "tbsp"),
                I("λεμόνι", 1, "pcs"),
                I("αλάτι", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Ξέπλυνε τις φακές μέχρι το νερό να βγει καθαρό.", 3, false, Array.Empty<int>(), "bowl"),
                S(2, "Σοτάρισε κρεμμύδι, καρότο και σκόρδο στο ελαιόλαδο.", 8, true, Array.Empty<int>(), "pot"),
                S(3, "Πρόσθεσε φακές, νερό και δάφνη. Άσε να πάρει βράση.", 10, true, new[] { 1, 2 }, "pot"),
                S(4, "Σιγόβρασε μέχρι να μαλακώσουν οι φακές. Παράλληλα ετοίμασε λεμόνι και πιάτα.", 20, true, new[] { 3 }, "pot"),
                S(5, "Αλάτι, λεμόνι, δοκίμασε και σερβίρισε.", 4, false, new[] { 4 }),
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
                I("μακαρόνια", 100 * servings, "g"),
                I("σκόρδο", 2, "pcs"),
                I("ντομάτα", 400, "g"),
                I("ελαιόλαδο", 2, "tbsp"),
                I("βασιλικός", 1, "handful", true),
                I("αλάτι", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Βάλε μεγάλη κατσαρόλα με αλατισμένο νερό να βράσει.", 8, true, Array.Empty<int>(), "pot"),
                S(2, "Στην κατσαρόλα της σάλτσας, σοτάρισε σκόρδο και ντομάτα. Μπορεί να τρέχει μαζί με το νερό.", 12, true, Array.Empty<int>(), "pan"),
                S(3, "Βράσε τα μακαρόνια al dente.", 10, true, new[] { 1 }, "pot"),
                S(4, "Στραγγίζοντας κράτα λίγο νερό. Ανακάτεψε με τη σάλτσα, βασιλικό, σερβίρισε.", 4, false, new[] { 2, 3 }),
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
                I("κοτόπουλο", 150 * servings, "g"),
                I("ελαιόλαδο", 2, "tbsp"),
                I("λεμόνι", 1, "pcs"),
                I("ρίγανη", 1, "tsp"),
                I("αλάτι", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Στέγνωσε το κοτόπουλο, αλάτι, ρίγανη, λεμόνι.", 5, false, Array.Empty<int>(), "board"),
                S(2, "Ζέστανε το τηγάνι με ελαιόλαδο μέχρι να τσιτσιρίζει.", 3, true, Array.Empty<int>(), "pan"),
                S(3, "Ψήσε την πρώτη πλευρά χωρίς να το κουνάς.", 7, true, new[] { 1, 2 }, "pan"),
                S(4, "Γύρνα το και ψήσε μέχρι 74°C μέσα.", 8, true, new[] { 3 }, "pan"),
                S(5, "Ξεκούρασε 3 λεπτά και σερβίρισε με λεμόνι.", 3, true, new[] { 4 }),
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
                I("ρύζι", 80 * servings, "g"),
                I("λαχανικά", 200, "g"),
                I("ελαιόλαδο", 1, "tbsp"),
                I("αλάτι", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Ξέπλυνε το ρύζι και βάλε το να βράσει σκεπασμένο.", 12, true, Array.Empty<int>(), "pot"),
                S(2, "Σοτάρισε τα λαχανικά σε άλλο τηγάνι όσο βράζει το ρύζι.", 10, true, Array.Empty<int>(), "pan"),
                S(3, "Άσε το ρύζι σκεπασμένο εκτός φωτιάς να φουσκώσει.", 5, true, new[] { 1 }, "pot"),
                S(4, "Ανακάτεψε ρύζι με λαχανικά και σερβίρισε.", 3, false, new[] { 2, 3 }),
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
                I("σαλάτα", 1, "bowl"),
                I("ελαιόλαδο", 2, "tbsp"),
                I("λεμόνι", 1, "pcs"),
                I("αλάτι", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Πλύνε και κόψε τα λαχανικά.", 6, false, Array.Empty<int>(), "board"),
                S(2, "Φτιάξε λαδολέμονο.", 2, false, Array.Empty<int>(), "bowl"),
                S(3, "Ανακάτεψε, δοκίμασε αλάτι, σερβίρισε.", 2, false, new[] { 1, 2 }),
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
                I("κύριο υλικό", 250 * servings / 2m, "g"),
                I("κρεμμύδι", 1, "pcs"),
                I("ελαιόλαδο", 2, "tbsp"),
                I("αλάτι", 1, "tsp"),
            },
            Steps = new()
            {
                S(1, "Κόψε όλα τα υλικά και ετοίμασε τα δίπλα στην εστία.", 6, false, Array.Empty<int>(), "board"),
                S(2, "Ζέστανε το τηγάνι με ελαιόλαδο.", 2, true, Array.Empty<int>(), "pan"),
                S(3, "Σοτάρισε το κρεμμύδι μέχρι να γυαλίσει.", 5, true, new[] { 1, 2 }, "pan"),
                S(4, "Πρόσθεσε το κύριο υλικό και μαγείρεψε μέχρι να είναι έτοιμο.", 12, true, new[] { 3 }, "pan"),
                S(5, "Διόρθωσε αλάτι και σερβίρισε.", 3, false, new[] { 4 }),
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
