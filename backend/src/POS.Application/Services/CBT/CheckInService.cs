using AutoMapper;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using POS.Application.DTOs.CBT;
using POS.Application.DTOs.Tasks;
using POS.Application.Services.Tasks;
using POS.Core.Entities.CBT;
using POS.Infrastructure.Data;

namespace POS.Application.Services.CBT;

/// <summary>
/// Check-in capture, drafts, reviewed suggestions, and linked records.
/// Migration: schemaVersion 1 remains a legacy CBT journal entry. Those rows keep
/// their original text, mood strings, and thought fields. Missing check-in fields
/// stay null. schemaVersion 2 is a Check-in record. Mood is not remapped into
/// feeling codes. AI insights are stored separately from user-confirmed fields
/// and are cleared when the original text is substantially edited.
/// </summary>
public class CheckInService
{
    public const int CurrentSchemaVersion = 2;
    private const int MaxTextLength = 5000;
    private const int MaxFieldLength = 2000;
    private const int MaxActions = 3;

    private static readonly HashSet<string> AllowedQuestionFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "situation", "thought", "feeling", "energy", "specificProblem", "smallestNextStep"
    };

    private static readonly string[] CrisisMarkers =
    {
        "suicide", "kill myself", "killing myself", "end my life", "want to die",
        "take my life", "self-harm", "self harm", "hurt myself", "don't want to be alive",
        "dont want to be alive"
    };

    private readonly MongoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ActivityCatalogService _catalog;
    private readonly TaskService _taskService;
    private readonly ILogger<CheckInService> _logger;

    public CheckInService(
        MongoDbContext context,
        IMapper mapper,
        ActivityCatalogService catalog,
        TaskService taskService,
        ILogger<CheckInService> logger)
    {
        _context = context;
        _mapper = mapper;
        _catalog = catalog;
        _taskService = taskService;
        _logger = logger;
    }

    public async Task<CBTEntryDto> CreateAsync(CreateCBTEntryRequest request, string userId)
    {
        var text = NormalizeOptional(request.Text, MaxTextLength);
        var feelings = NormalizeFeelings(request.Feelings);

        var supportType = NormalizeSupport(request.SupportType);
        if (text == null && (feelings == null || feelings.Count == 0) &&
            supportType is not ("small_step" or "settle"))
        {
            throw new ArgumentException("A few words or a feeling is enough to save.");
        }

        var now = DateTime.UtcNow;
        var title = BuildTitle(request.Title, text, feelings);
        var entry = new CBTEntry
        {
            UserId = userId,
            Text = text ?? string.Empty,
            Title = title,
            SchemaVersion = CurrentSchemaVersion,
            RecordState = NormalizeState(request.RecordState, "draft"),
            SupportType = supportType,
            OccurredAtUtc = request.OccurredAtUtc ?? now,
            Timezone = TrimTo(request.Timezone, 80),
            UtcOffsetMinutes = request.UtcOffsetMinutes,
            Energy = NormalizeEnergy(request.Energy),
            Feelings = feelings,
            LinkedUnlockEventId = TrimTo(request.LinkedUnlockEventId, 80),
            Status = "pending",
            CreatedAt = now,
            UpdatedAt = now
        };

        ApplyStateFromFeelings(entry);

        await _context.CBTEntries.InsertOneAsync(entry);
        _logger.LogInformation("Created check-in {EntryId} for user {UserId}", entry.Id, userId);
        return _mapper.Map<CBTEntryDto>(entry);
    }

    public async Task<List<CBTEntryDto>> ListAsync(
        string userId,
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        string? recordState = null,
        string? recordType = null)
    {
        var filter = Builders<CBTEntry>.Filter.Eq(e => e.UserId, userId);

        if (fromUtc.HasValue)
        {
            filter &= Builders<CBTEntry>.Filter.Gte(e => e.CreatedAt, fromUtc.Value);
        }

        if (toUtc.HasValue)
        {
            filter &= Builders<CBTEntry>.Filter.Lt(e => e.CreatedAt, toUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(recordState))
        {
            filter &= Builders<CBTEntry>.Filter.Eq(e => e.RecordState, recordState);
        }

        var entries = await _context.CBTEntries
            .Find(filter)
            .Sort(Builders<CBTEntry>.Sort.Descending(e => e.CreatedAt))
            .Limit(200)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(recordType))
        {
            entries = entries.Where(entry => MatchesType(entry, recordType)).ToList();
        }

        return _mapper.Map<List<CBTEntryDto>>(entries);
    }

    public async Task<CBTEntryDto?> GetAsync(string id, string userId)
    {
        var entry = await FindOwnedAsync(id, userId);
        return entry == null ? null : _mapper.Map<CBTEntryDto>(entry);
    }

    public async Task<CBTEntryDto?> UpdateAsync(string id, UpdateCBTEntryRequest request, string userId)
    {
        var entry = await FindOwnedAsync(id, userId);
        if (entry == null)
        {
            return null;
        }

        var previousText = entry.Text;
        if (request.Text != null)
        {
            entry.Text = NormalizeOptional(request.Text, MaxTextLength) ?? string.Empty;
        }

        if (request.Title != null)
        {
            entry.Title = TrimTo(request.Title, 120);
        }

        if (request.RecordState != null)
        {
            entry.RecordState = NormalizeState(request.RecordState, entry.RecordState);
        }

        if (request.SupportType != null)
        {
            entry.SupportType = NormalizeSupport(request.SupportType);
        }

        if (request.Energy != null)
        {
            entry.Energy = NormalizeEnergy(request.Energy);
        }

        if (request.Feelings != null)
        {
            entry.Feelings = NormalizeFeelings(request.Feelings);
            ApplyStateFromFeelings(entry);
        }

        if (request.Situation != null)
        {
            entry.Situation = NormalizeOptional(request.Situation, MaxFieldLength);
        }

        if (request.AutomaticThoughts != null)
        {
            entry.AutomaticThoughts = _mapper.Map<List<AutomaticThought>>(request.AutomaticThoughts);
        }

        if (request.EvidenceFor != null)
        {
            entry.EvidenceFor = request.EvidenceFor.Select(item => TrimTo(item, MaxFieldLength) ?? string.Empty).ToList();
        }

        if (request.EvidenceAgainst != null)
        {
            entry.EvidenceAgainst = request.EvidenceAgainst.Select(item => TrimTo(item, MaxFieldLength) ?? string.Empty).ToList();
        }

        if (request.AlternativeThoughts != null)
        {
            entry.AlternativeThoughts = request.AlternativeThoughts.Select(item => TrimTo(item, MaxFieldLength) ?? string.Empty).ToList();
        }

        if (request.Outcome != null)
        {
            entry.Outcome = NormalizeOptional(request.Outcome, MaxFieldLength);
        }

        if (request.ThoughtState != null)
        {
            entry.ThoughtState = NormalizeState(request.ThoughtState, entry.ThoughtState ?? "draft");
        }

        if (request.BeliefBefore.HasValue)
        {
            entry.BeliefBefore = ClampRating(request.BeliefBefore);
        }

        if (request.BeliefAfter.HasValue)
        {
            entry.BeliefAfter = ClampRating(request.BeliefAfter);
        }

        if (request.ProblemSolving != null)
        {
            entry.ProblemSolving = MapProblemSolving(request.ProblemSolving);
        }

        if (request.LinkedUnlockEventId != null)
        {
            entry.LinkedUnlockEventId = TrimTo(request.LinkedUnlockEventId, 80);
        }

        if (entry.SchemaVersion < CurrentSchemaVersion)
        {
            entry.SchemaVersion = CurrentSchemaVersion;
        }

        if (!string.Equals(previousText, entry.Text, StringComparison.Ordinal))
        {
            entry.AIInsights = null;
            entry.CognitiveDistortions = null;
            entry.ProcessedAt = null;
        }

        if (string.IsNullOrWhiteSpace(entry.Title))
        {
            entry.Title = BuildTitle(null, entry.Text, entry.Feelings);
        }

        entry.UpdatedAt = DateTime.UtcNow;
        await _context.CBTEntries.ReplaceOneAsync(OwnedFilter(id, userId), entry);
        return _mapper.Map<CBTEntryDto>(entry);
    }

    public async Task<bool> DeleteAsync(string id, string userId)
    {
        var entry = await FindOwnedAsync(id, userId);
        if (entry == null)
        {
            return false;
        }

        await _context.CBTEntries.DeleteOneAsync(OwnedFilter(id, userId));
        _logger.LogInformation("Deleted check-in {EntryId} for user {UserId}", id, userId);
        return true;
    }

    public async Task<CheckInAssistResponse?> AssistAsync(string id, CheckInAssistRequest request, string userId)
    {
        var entry = await FindOwnedAsync(id, userId);
        if (entry == null)
        {
            return null;
        }

        if (LooksLikeImmediateDanger(entry.Text))
        {
            return new CheckInAssistResponse
            {
                UsedAi = false,
                Reflection = "If you are in immediate danger, contact local emergency services now. In the EU you can call 112. Local suicide-prevention resources are listed by IASP at https://www.iasp.info/suicidalthoughts/",
                SuggestedEmotionCodes = null,
                Question = null,
                SuggestedActions = new List<CheckInSuggestedAction>()
            };
        }

        var supportType = NormalizeSupport(request.SupportType) ?? entry.SupportType;
        var feelingCodes = (entry.Feelings ?? new List<FeelingRating>())
            .Select(feeling => feeling.Code)
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Cast<string>()
            .ToList();

        var excluded = new List<string>(request.ExcludedTemplateIds ?? new List<string>());
        excluded.AddRange(await HarderTemplateIdsAsync(userId));

        var ranked = _catalog.Rank(
            supportType,
            entry.Energy,
            feelingCodes,
            request.DismissedTemplateIds,
            excluded.Distinct(StringComparer.OrdinalIgnoreCase),
            request.RequestedCategory);

        var actions = ranked.Take(MaxActions).Select(template => new CheckInSuggestedAction
        {
            TemplateId = template.Id,
            Rationale = BuildRationale(supportType, entry.Energy, request.RequestedCategory),
            ProposedFirstStep = template.FirstStep
        }).ToList();

        return new CheckInAssistResponse
        {
            UsedAi = false,
            Reflection = BuildFallbackReflection(entry),
            SuggestedEmotionCodes = feelingCodes.Where(ActivityCatalogService.IsKnownEmotion).Take(4).ToList(),
            Question = BuildQuestion(entry, supportType),
            SuggestedActions = actions
        };
    }

    public async Task<CBTEntryDto?> SaveThoughtRecordAsync(string id, UpdateCBTEntryRequest request, string userId)
    {
        request.ThoughtState ??= "draft";
        if (HasThoughtContent(request))
        {
            request.ThoughtState = request.ThoughtState == "saved" || request.ThoughtState == "completed"
                ? "completed"
                : request.ThoughtState;
        }

        return await UpdateAsync(id, request, userId);
    }

    public async Task<CBTEntryDto?> SaveProblemSolvingAsync(string id, ProblemSolvingRecordDto record, string userId)
    {
        return await UpdateAsync(id, new UpdateCBTEntryRequest
        {
            ProblemSolving = record,
            SupportType = "work_problem"
        }, userId);
    }

    public IReadOnlyList<ActivityTemplateDto> GetTemplates() => _catalog.GetAll();

    public async Task<BehavioralActivityDto> CreatePlanAsync(CreateBehavioralActivityRequest request, string userId)
    {
        if (string.IsNullOrWhiteSpace(request.Title) && string.IsNullOrWhiteSpace(request.TemplateId))
        {
            throw new ArgumentException("Choose an activity or write your own.");
        }

        if (!string.IsNullOrWhiteSpace(request.CheckInId))
        {
            var checkIn = await FindOwnedAsync(request.CheckInId, userId);
            if (checkIn == null)
            {
                throw new ArgumentException("Check-in not found.");
            }
        }

        var template = _catalog.GetById(request.TemplateId);
        var now = DateTime.UtcNow;
        var activity = new BehavioralActivity
        {
            UserId = userId,
            Title = TrimTo(request.Title, 200) ?? template?.Title ?? "Small step",
            Description = NormalizeOptional(request.Description, MaxFieldLength) ?? template?.Instructions,
            ScheduledDate = request.ScheduledDate,
            Notes = NormalizeOptional(request.Notes, MaxFieldLength),
            SchemaVersion = CurrentSchemaVersion,
            CheckInId = TrimTo(request.CheckInId, 80),
            TemplateId = template?.Id ?? TrimTo(request.TemplateId, 80),
            TemplateVersion = template?.ContentVersion ?? request.TemplateVersion ?? ActivityCatalogService.ContentVersion,
            Lifecycle = NormalizeLifecycle(request.Lifecycle, "planned"),
            FirstStep = TrimTo(request.FirstStep, MaxFieldLength) ?? template?.FirstStep,
            Category = TrimTo(request.Category, 40) ?? template?.Category,
            Effort = TrimTo(request.Effort, 20) ?? template?.Effort,
            DurationMinutes = request.DurationMinutes ?? template?.DurationMinutes,
            IsCompleted = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.BehavioralActivities.InsertOneAsync(activity);
        return _mapper.Map<BehavioralActivityDto>(activity);
    }

    public async Task<List<BehavioralActivityDto>> ListPlansAsync(string userId, string? checkInId = null)
    {
        var filter = Builders<BehavioralActivity>.Filter.Eq(a => a.UserId, userId);
        if (!string.IsNullOrWhiteSpace(checkInId))
        {
            filter &= Builders<BehavioralActivity>.Filter.Eq(a => a.CheckInId, checkInId);
        }

        var plans = await _context.BehavioralActivities
            .Find(filter)
            .Sort(Builders<BehavioralActivity>.Sort.Descending(a => a.UpdatedAt).Descending(a => a.CreatedAt))
            .Limit(200)
            .ToListAsync();

        return _mapper.Map<List<BehavioralActivityDto>>(plans);
    }

    public async Task<BehavioralActivityDto?> UpdatePlanAsync(string id, UpdateBehavioralActivityRequest request, string userId)
    {
        var plan = await FindOwnedPlanAsync(id, userId);
        if (plan == null)
        {
            return null;
        }

        if (request.Title != null)
        {
            plan.Title = TrimTo(request.Title, 200) ?? plan.Title;
        }

        if (request.Description != null)
        {
            plan.Description = NormalizeOptional(request.Description, MaxFieldLength);
        }

        if (request.ScheduledDate.HasValue)
        {
            plan.ScheduledDate = request.ScheduledDate;
        }

        if (request.Notes != null)
        {
            plan.Notes = NormalizeOptional(request.Notes, MaxFieldLength);
        }

        if (request.Lifecycle != null)
        {
            plan.Lifecycle = NormalizeLifecycle(request.Lifecycle, plan.Lifecycle ?? "planned");
            plan.IsCompleted = plan.Lifecycle is "completed" or "partially_completed";
            if (plan.IsCompleted && plan.CompletedDate == null)
            {
                plan.CompletedDate = DateTime.UtcNow;
            }
        }

        if (request.FirstStep != null)
        {
            plan.FirstStep = TrimTo(request.FirstStep, MaxFieldLength);
        }

        plan.UpdatedAt = DateTime.UtcNow;
        await _context.BehavioralActivities.ReplaceOneAsync(OwnedPlanFilter(id, userId), plan);
        return _mapper.Map<BehavioralActivityDto>(plan);
    }

    public async Task<BehavioralActivityDto?> RecordAttemptAsync(string id, CreateActivityAttemptRequest request, string userId)
    {
        var plan = await FindOwnedPlanAsync(id, userId);
        if (plan == null)
        {
            return null;
        }

        plan.CompletionExtent = NormalizeExtent(request.CompletionExtent);
        plan.Usefulness = NormalizeUsefulness(request.Usefulness);
        plan.Enjoyment = TrimTo(request.Enjoyment, 40);
        plan.Accomplishment = TrimTo(request.Accomplishment, 40);
        plan.ChangeNextTime = NormalizeOptional(request.ChangeNextTime, MaxFieldLength);
        if (request.Notes != null)
        {
            plan.Notes = NormalizeOptional(request.Notes, MaxFieldLength);
        }

        if (request.DurationMinutes.HasValue)
        {
            plan.DurationMinutes = request.DurationMinutes;
        }

        plan.Lifecycle = plan.CompletionExtent switch
        {
            "did_it" => "completed",
            "did_part" => "partially_completed",
            "didnt_try" => "not_attempted",
            _ => plan.Lifecycle ?? "planned"
        };
        plan.IsCompleted = plan.Lifecycle is "completed" or "partially_completed";
        plan.CompletedDate = request.AttemptedAtUtc ?? DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.BehavioralActivities.ReplaceOneAsync(OwnedPlanFilter(id, userId), plan);

        if (request.FeelingAfter is { Count: > 0 } && !string.IsNullOrWhiteSpace(plan.CheckInId))
        {
            var checkIn = await FindOwnedAsync(plan.CheckInId, userId);
            if (checkIn != null)
            {
                checkIn.Feelings ??= new List<FeelingRating>();
                checkIn.Feelings.AddRange(NormalizeFeelings(request.FeelingAfter, "after") ?? new List<FeelingRating>());
                checkIn.UpdatedAt = DateTime.UtcNow;
                await _context.CBTEntries.ReplaceOneAsync(OwnedFilter(plan.CheckInId, userId), checkIn);
            }
        }

        return _mapper.Map<BehavioralActivityDto>(plan);
    }

    public async Task<LinkActivityTaskResponse?> LinkTaskAsync(string id, string userId)
    {
        var plan = await FindOwnedPlanAsync(id, userId);
        if (plan == null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(plan.LinkedTaskId))
        {
            return new LinkActivityTaskResponse
            {
                Activity = _mapper.Map<BehavioralActivityDto>(plan),
                TaskId = plan.LinkedTaskId,
                AlreadyLinked = true
            };
        }

        var task = await _taskService.CreateTaskAsync(new CreateTaskRequest
        {
            Title = plan.Title.Length > 200 ? plan.Title[..200] : plan.Title,
            Category = "health",
            Notes = plan.FirstStep,
            Status = "inbox",
            Tags = new List<string> { "check-in" }
        }, userId);

        plan.LinkedTaskId = task.Id;
        plan.UpdatedAt = DateTime.UtcNow;
        await _context.BehavioralActivities.ReplaceOneAsync(OwnedPlanFilter(id, userId), plan);

        return new LinkActivityTaskResponse
        {
            Activity = _mapper.Map<BehavioralActivityDto>(plan),
            TaskId = task.Id,
            AlreadyLinked = false
        };
    }

    public static CheckInAssistResponse ValidateAssistResponse(CheckInAssistResponse response, ActivityCatalogService catalog)
    {
        if (response.SuggestedEmotionCodes != null)
        {
            response.SuggestedEmotionCodes = response.SuggestedEmotionCodes
                .Where(ActivityCatalogService.IsKnownEmotion)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(6)
                .ToList();
        }

        if (response.Question != null)
        {
            response.Question.Text = TrimTo(response.Question.Text, 240) ?? string.Empty;
            if (string.IsNullOrWhiteSpace(response.Question.Text) ||
                !AllowedQuestionFields.Contains(response.Question.TargetField))
            {
                response.Question = null;
            }
        }

        if (response.SuggestedActions != null)
        {
            response.SuggestedActions = response.SuggestedActions
                .Where(action => catalog.GetById(action.TemplateId) != null)
                .Take(MaxActions)
                .Select(action =>
                {
                    action.Rationale = TrimTo(action.Rationale, 240) ?? string.Empty;
                    action.ProposedFirstStep = TrimTo(action.ProposedFirstStep, MaxFieldLength);
                    return action;
                })
                .ToList();
        }

        response.Reflection = TrimTo(response.Reflection, 500);
        return response;
    }

    private async Task<CBTEntry?> FindOwnedAsync(string id, string userId) =>
        await _context.CBTEntries.Find(OwnedFilter(id, userId)).FirstOrDefaultAsync();

    private async Task<BehavioralActivity?> FindOwnedPlanAsync(string id, string userId) =>
        await _context.BehavioralActivities.Find(OwnedPlanFilter(id, userId)).FirstOrDefaultAsync();

    private static FilterDefinition<CBTEntry> OwnedFilter(string id, string userId) =>
        Builders<CBTEntry>.Filter.Eq(e => e.Id, id) & Builders<CBTEntry>.Filter.Eq(e => e.UserId, userId);

    private static FilterDefinition<BehavioralActivity> OwnedPlanFilter(string id, string userId) =>
        Builders<BehavioralActivity>.Filter.Eq(a => a.Id, id) & Builders<BehavioralActivity>.Filter.Eq(a => a.UserId, userId);

    private async Task<List<string>> HarderTemplateIdsAsync(string userId)
    {
        var filter = Builders<BehavioralActivity>.Filter.Eq(a => a.UserId, userId) &
                     Builders<BehavioralActivity>.Filter.Eq(a => a.Usefulness, "made_things_harder");
        var plans = await _context.BehavioralActivities
            .Find(filter)
            .Project(a => a.TemplateId)
            .ToListAsync();
        return plans.Where(id => !string.IsNullOrWhiteSpace(id)).Cast<string>().Distinct().ToList();
    }

    private static bool MatchesType(CBTEntry entry, string recordType)
    {
        return recordType switch
        {
            "draft" => entry.RecordState == "draft",
            "thought" => !string.IsNullOrWhiteSpace(entry.ThoughtState) ||
                         !string.IsNullOrWhiteSpace(entry.Situation) ||
                         (entry.AutomaticThoughts?.Count ?? 0) > 0,
            "problem" => entry.ProblemSolving != null,
            "checkin" => entry.SchemaVersion >= CurrentSchemaVersion,
            "legacy" => entry.SchemaVersion < CurrentSchemaVersion,
            _ => true
        };
    }

    private static bool HasThoughtContent(UpdateCBTEntryRequest request) =>
        request.Situation != null ||
        request.AutomaticThoughts != null ||
        request.EvidenceFor != null ||
        request.EvidenceAgainst != null ||
        request.AlternativeThoughts != null;

    private static string? BuildFallbackReflection(CBTEntry entry)
    {
        if (!string.IsNullOrWhiteSpace(entry.Text))
        {
            return "You wrote this in your own words. You can save it as it is, or choose one kind of support.";
        }

        if (entry.Feelings is { Count: > 0 })
        {
            return "You named how you feel. That is enough to continue or stop here.";
        }

        return null;
    }

    private static CheckInAssistQuestion? BuildQuestion(CBTEntry entry, string? supportType)
    {
        if (string.Equals(supportType, "understand_thought", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(entry.Situation))
        {
            return new CheckInAssistQuestion { Text = "What happened?", TargetField = "situation" };
        }

        if (string.Equals(supportType, "work_problem", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(entry.ProblemSolving?.SpecificProblem))
        {
            return new CheckInAssistQuestion { Text = "What is the specific problem?", TargetField = "specificProblem" };
        }

        return null;
    }

    private static string BuildRationale(string? supportType, string? energy, string? requestedCategory)
    {
        if (!string.IsNullOrWhiteSpace(requestedCategory))
        {
            return "You asked for an option in this area.";
        }

        if (string.Equals(energy, "very_little", StringComparison.OrdinalIgnoreCase))
        {
            return "You asked for a low-effort way to get started.";
        }

        return supportType switch
        {
            "settle" => "You asked for a brief way to settle for a moment.",
            "work_problem" => "You asked for a practical next step.",
            "understand_thought" => "You asked for a small way to look at the thought.",
            _ => "A small, startable option from the reviewed list."
        };
    }

    private static bool LooksLikeImmediateDanger(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var lower = text.ToLowerInvariant();
        return CrisisMarkers.Any(marker => lower.Contains(marker, StringComparison.Ordinal));
    }

    private static List<FeelingRating>? NormalizeFeelings(List<FeelingRatingDto>? source, string defaultPhase = "before")
    {
        if (source == null)
        {
            return null;
        }

        return source.Select(item => new FeelingRating
        {
            Code = ActivityCatalogService.IsKnownEmotion(item.Code) ? item.Code : null,
            CustomLabel = TrimTo(item.CustomLabel, 80),
            Intensity = ClampRating(item.Intensity),
            ScaleMin = 0,
            ScaleMax = 10,
            Phase = string.IsNullOrWhiteSpace(item.Phase) ? defaultPhase : item.Phase,
            MeasuredAtUtc = item.MeasuredAtUtc == default ? DateTime.UtcNow : item.MeasuredAtUtc
        }).Where(item => item.Code != null || item.CustomLabel != null).ToList();
    }

    private static ProblemSolvingRecord MapProblemSolving(ProblemSolvingRecordDto dto)
    {
        return new ProblemSolvingRecord
        {
            SpecificProblem = NormalizeOptional(dto.SpecificProblem, MaxFieldLength),
            ControllablePart = NormalizeOptional(dto.ControllablePart, MaxFieldLength),
            Options = dto.Options?.Select(option => TrimTo(option, MaxFieldLength) ?? string.Empty)
                .Where(option => option.Length > 0)
                .Take(8)
                .ToList(),
            SelectedOption = NormalizeOptional(dto.SelectedOption, MaxFieldLength),
            SmallestNextStep = NormalizeOptional(dto.SmallestNextStep, MaxFieldLength),
            State = NormalizeState(dto.State, "draft")
        };
    }

    private static void ApplyStateFromFeelings(CBTEntry entry)
    {
        if (entry.Feelings == null)
        {
            return;
        }

        if (entry.Feelings.Any(feeling => feeling.Code == "tired"))
        {
            entry.Tiredness = "present";
        }

        if (entry.Feelings.Any(feeling => feeling.Code == "numb_disconnected"))
        {
            entry.Numbness = "present";
        }
    }

    private static string BuildTitle(string? requested, string? text, List<FeelingRating>? feelings)
    {
        var title = TrimTo(requested, 120);
        if (!string.IsNullOrWhiteSpace(title))
        {
            return title;
        }

        if (!string.IsNullOrWhiteSpace(text))
        {
            var trimmed = text.Trim();
            return trimmed.Length <= 60 ? trimmed : trimmed[..60].TrimEnd() + "…";
        }

        var firstFeeling = feelings?.FirstOrDefault(feeling => feeling.CustomLabel != null || feeling.Code != null);
        if (firstFeeling?.CustomLabel != null)
        {
            return firstFeeling.CustomLabel;
        }

        return "Check-in";
    }

    private static string? NormalizeSupport(string? value)
    {
        var trimmed = TrimTo(value, 40);
        return ActivityCatalogService.IsKnownSupportType(trimmed) ? trimmed : trimmed;
    }

    private static string? NormalizeEnergy(string? value)
    {
        var trimmed = TrimTo(value, 20);
        return trimmed is "very_little" or "some" or "plenty" or "not_sure" ? trimmed : null;
    }

    private static string NormalizeState(string? value, string fallback)
    {
        return value switch
        {
            "draft" or "saved" or "completed" => value,
            _ => fallback
        };
    }

    private static string NormalizeLifecycle(string? value, string fallback)
    {
        return value switch
        {
            "offered" or "selected" or "dismissed" or "planned" or "in_progress"
                or "completed" or "partially_completed" or "not_attempted" or "cancelled" => value,
            _ => fallback
        };
    }

    private static string? NormalizeExtent(string? value) =>
        value is "did_it" or "did_part" or "didnt_try" ? value : null;

    private static string? NormalizeUsefulness(string? value) =>
        value is "helpful" or "a_little_helpful" or "not_helpful" or "made_things_harder" or "not_sure"
            ? value
            : null;

    private static int? ClampRating(int? value)
    {
        if (!value.HasValue)
        {
            return null;
        }

        return Math.Clamp(value.Value, 0, 10);
    }

    private static string? NormalizeOptional(string? value, int max)
    {
        var trimmed = TrimTo(value, max);
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static string? TrimTo(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= max ? trimmed : trimmed[..max];
    }
}
