using POS.Application.DTOs.CBT;

namespace POS.Application.Services.CBT;

/// <summary>
/// Reviewed activity templates. These are startable self-help options, not treatments.
/// </summary>
public class ActivityCatalogService
{
    public const string ContentVersion = "1";

    private static readonly HashSet<string> AllowedEmotionCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "anxious", "sad_low", "frustrated_angry", "overwhelmed", "lonely",
        "ashamed_guilty", "calm", "happy_content", "hopeful", "other",
        "not_sure", "numb_disconnected", "tired", "confused"
    };

    private static readonly HashSet<string> AllowedSupportTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "save", "understand_thought", "work_problem", "small_step", "settle"
    };

    private readonly IReadOnlyList<ActivityTemplateDto> _templates = BuildCatalog();

    public IReadOnlyList<ActivityTemplateDto> GetAll() => _templates;

    public ActivityTemplateDto? GetById(string? id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        return _templates.FirstOrDefault(t => t.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsKnownEmotion(string? code) =>
        !string.IsNullOrWhiteSpace(code) && AllowedEmotionCodes.Contains(code);

    public static bool IsKnownSupportType(string? supportType) =>
        !string.IsNullOrWhiteSpace(supportType) && AllowedSupportTypes.Contains(supportType);

    public IReadOnlyList<ActivityTemplateDto> Rank(
        string? supportType,
        string? energy,
        IEnumerable<string>? feelingCodes,
        IEnumerable<string>? dismissedTemplateIds,
        IEnumerable<string>? excludedTemplateIds,
        string? requestedCategory)
    {
        var dismissed = new HashSet<string>(dismissedTemplateIds ?? Array.Empty<string>(), StringComparer.OrdinalIgnoreCase);
        var excluded = new HashSet<string>(excludedTemplateIds ?? Array.Empty<string>(), StringComparer.OrdinalIgnoreCase);
        var feelings = new HashSet<string>(
            (feelingCodes ?? Array.Empty<string>()).Where(code => !string.IsNullOrWhiteSpace(code)),
            StringComparer.OrdinalIgnoreCase);

        var scored = _templates
            .Where(template => !dismissed.Contains(template.Id) && !excluded.Contains(template.Id))
            .Select(template => new
            {
                Template = template,
                Score = Score(template, supportType, energy, feelings, requestedCategory)
            })
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Template.DurationMinutes)
            .ThenBy(item => item.Template.Title)
            .ToList();

        if (string.Equals(supportType, "settle", StringComparison.OrdinalIgnoreCase))
        {
            var nonBreathing = scored.Where(item => !item.Template.IsBreathing).ToList();
            if (nonBreathing.Count > 0)
            {
                scored = nonBreathing.Concat(scored.Where(item => item.Template.IsBreathing)).ToList();
            }
        }

        return scored.Take(3).Select(item => item.Template).ToList();
    }

    private static int Score(
        ActivityTemplateDto template,
        string? supportType,
        string? energy,
        HashSet<string> feelings,
        string? requestedCategory)
    {
        var score = 1;

        if (!string.IsNullOrWhiteSpace(requestedCategory) &&
            template.Category.Equals(requestedCategory, StringComparison.OrdinalIgnoreCase))
        {
            score += 4;
        }

        if (string.Equals(energy, "very_little", StringComparison.OrdinalIgnoreCase) &&
            template.Effort.Equals("low", StringComparison.OrdinalIgnoreCase))
        {
            score += 3;
        }
        else if (string.Equals(energy, "some", StringComparison.OrdinalIgnoreCase) &&
                 (template.Effort.Equals("low", StringComparison.OrdinalIgnoreCase) ||
                  template.Effort.Equals("medium", StringComparison.OrdinalIgnoreCase)))
        {
            score += 2;
        }
        else if (string.Equals(energy, "plenty", StringComparison.OrdinalIgnoreCase))
        {
            score += 1;
        }

        if (string.Equals(supportType, "settle", StringComparison.OrdinalIgnoreCase) &&
            (template.Category is "rest" or "coping_skill"))
        {
            score += 4;
        }
        else if (string.Equals(supportType, "small_step", StringComparison.OrdinalIgnoreCase) &&
                 template.Effort.Equals("low", StringComparison.OrdinalIgnoreCase))
        {
            score += 3;
        }
        else if (string.Equals(supportType, "work_problem", StringComparison.OrdinalIgnoreCase) &&
                 (template.Category is "necessary" or "routine"))
        {
            score += 4;
        }
        else if (string.Equals(supportType, "understand_thought", StringComparison.OrdinalIgnoreCase) &&
                 template.Category is "coping_skill")
        {
            score += 2;
        }

        if (feelings.Contains("lonely") && template.Category == "connection")
        {
            score += 3;
        }

        if (feelings.Contains("tired") && template.Category == "rest")
        {
            score += 2;
        }

        if (feelings.Contains("numb_disconnected") && template.Category is "rest" or "coping_skill")
        {
            score += 2;
        }

        if ((feelings.Contains("happy_content") || feelings.Contains("hopeful") || feelings.Contains("calm")) &&
            template.Category == "enjoyable")
        {
            score += 2;
        }

        if (feelings.Contains("overwhelmed") && template.Effort == "low")
        {
            score += 2;
        }

        return score;
    }

    private static IReadOnlyList<ActivityTemplateDto> BuildCatalog()
    {
        return new List<ActivityTemplateDto>
        {
            Template(
                "write-one-sentence",
                "Write down the one thing bothering you most.",
                "Open a note and write one sentence.",
                "One sentence is enough. You can stop afterward.",
                2,
                "low",
                "Give the thought a short, concrete shape.",
                "A place to write, even a scrap of paper.",
                "Name the thought in a few words, then stop.",
                "coping_skill"),
            Template(
                "open-document",
                "Open the document and read its title.",
                "Find the file or tab and open it.",
                "You do not need to write anything yet. Opening it is the step.",
                2,
                "low",
                "Make a postponed task visible.",
                "Access to the file or email.",
                "Find the file name without opening it.",
                "necessary"),
            Template(
                "put-away-three",
                "Put away three things from one surface.",
                "Pick one table, desk, or counter.",
                "Three items is enough. Leave the rest.",
                3,
                "low",
                "A small practical reset.",
                "One surface you can reach.",
                "Put away one item.",
                "routine"),
            Template(
                "step-outside",
                "Step outside for two minutes.",
                "Stand up and go to the nearest outdoor threshold.",
                "You can stay near the door. Coming back is fine.",
                2,
                "low",
                "A short change of scene.",
                "A door you can use safely.",
                "Open a window and look out for one minute.",
                "enjoyable"),
            Template(
                "send-short-message",
                "Send one person a short message.",
                "Open a message to one person you already talk to.",
                "A short hello or check-in is enough. You can send it later if that feels better.",
                3,
                "low",
                "A light connection without a long conversation.",
                "Someone you feel okay contacting.",
                "Open the chat and type a greeting without sending.",
                "connection"),
            Template(
                "basic-care",
                "Choose one manageable basic-care activity.",
                "Pick water, a snack, washing your face, or taking prescribed medication you already use.",
                "Choose one. This is ordinary care, not a programme.",
                5,
                "low",
                "Meet one immediate physical need.",
                "Whatever you already have at hand.",
                "Drink a few sips of water.",
                "routine"),
            Template(
                "listen-one-song",
                "Listen to one song without opening another app.",
                "Play one song you already know.",
                "Stay with that one track. You can stop whenever you want.",
                4,
                "low",
                "A short enjoyable pause.",
                "Music you can play without searching for long.",
                "Play the first 30 seconds, then decide.",
                "enjoyable"),
            Template(
                "sit-and-notice",
                "Notice five things you can see.",
                "Sit or stand still and name five objects nearby.",
                "This is optional. If it feels uncomfortable, stop. No breathing is required.",
                2,
                "low",
                "A brief way to settle without breath work.",
                "A place you can pause for a moment.",
                "Name one object you can see, then stop.",
                "coping_skill"),
            Template(
                "optional-slow-breath",
                "Try a few comfortable breaths, or skip this.",
                "Breathe in a way that already feels ordinary.",
                "Do not hold your breath or push through discomfort. Stop anytime. A non-breathing option is available.",
                2,
                "low",
                "An optional calming pause.",
                "A quiet moment. No special equipment.",
                "Take one ordinary breath, then stop.",
                "coping_skill",
                isBreathing: true),
            Template(
                "drink-water",
                "Get a glass of water.",
                "Fill a glass or take the bottle you already have.",
                "A few sips count. You can leave the rest.",
                2,
                "low",
                "A small, practical reset.",
                "Water you can reach.",
                "Take one sip.",
                "routine"),
            Template(
                "find-the-email",
                "Find the relevant email and leave it open.",
                "Search for the message and open it.",
                "You do not need to reply or finish the paperwork.",
                3,
                "low",
                "Make the next admin step visible.",
                "Access to the inbox.",
                "Write down the search words you would use.",
                "necessary"),
            Template(
                "stretch-shoulders",
                "Roll your shoulders once.",
                "Sit or stand and roll both shoulders back once.",
                "Stop if anything hurts. This is optional.",
                1,
                "low",
                "A tiny physical pause.",
                "Enough space to move your shoulders.",
                "Drop your shoulders once.",
                "coping_skill"),
            Template(
                "rest-without-goal",
                "Sit or lie down for two minutes without a goal.",
                "Choose a chair or bed and set nothing else up.",
                "Rest is a legitimate choice. You can stop when you want.",
                2,
                "low",
                "Allow a short pause.",
                "A place to sit or lie down.",
                "Close your eyes for three slow counts.",
                "rest"),
            Template(
                "small-enjoyable",
                "Do one small thing you usually enjoy.",
                "Pick something already nearby: tea, a page, a plant, a short comic.",
                "Keep it small. Enjoyment does not have to be productive.",
                5,
                "low",
                "Make room for something pleasant.",
                "Something you already like and can reach.",
                "Look at one enjoyable object for a minute.",
                "enjoyable"),
            Template(
                "write-went-well",
                "Write one thing that went well.",
                "Write a single sentence about something that worked, even slightly.",
                "It can be small. You can stop after the sentence.",
                2,
                "low",
                "Notice one solid fact from your day.",
                "A place to write.",
                "Name the thing in a few words.",
                "coping_skill")
        };
    }

    private static ActivityTemplateDto Template(
        string id,
        string title,
        string firstStep,
        string instructions,
        int durationMinutes,
        string effort,
        string purpose,
        string requirements,
        string smallerVersion,
        string category,
        bool isBreathing = false)
    {
        return new ActivityTemplateDto
        {
            Id = id,
            Title = title,
            FirstStep = firstStep,
            Instructions = instructions,
            DurationMinutes = durationMinutes,
            Effort = effort,
            Purpose = purpose,
            Requirements = requirements,
            SmallerVersion = smallerVersion,
            Category = category,
            Source = "reviewed-catalog",
            ContentVersion = ContentVersion,
            IsBreathing = isBreathing
        };
    }
}
