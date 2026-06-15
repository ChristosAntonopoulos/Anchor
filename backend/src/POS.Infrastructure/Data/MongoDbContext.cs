using MongoDB.Driver;
using POS.Core.Entities;
using POS.Core.Entities.Schedule;
using POS.Core.Entities.BetterToday;
using POS.Core.Entities.Tasks;
using POS.Core.Entities.Discipline;
using POS.Core.Entities.Diet;
using POS.Core.Entities.Money;
using POS.Core.Entities.Deadlines;
using POS.Core.Entities.WeeklyReview;
using POS.Core.Entities.AIInput;
using POS.Core.Entities.CBT;
using POS.Core.Entities.Notifications;

namespace POS.Infrastructure.Data;

/// <summary>
/// MongoDB database context providing access to all collections
/// </summary>
public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IMongoDatabase database)
    {
        _database = database;
    }

    // Core collections
    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Day> Days => _database.GetCollection<Day>("days");
    public IMongoCollection<DayStartPlan> DayStartPlans =>
        _database.GetCollection<DayStartPlan>("dayStartPlans");
    public IMongoCollection<AIJobRun> AIJobRuns => _database.GetCollection<AIJobRun>("aiJobRuns");

    // Schedule collections
    public IMongoCollection<ScheduleBlockDefinition> ScheduleBlockDefinitions => 
        _database.GetCollection<ScheduleBlockDefinition>("scheduleBlockDefinitions");
    public IMongoCollection<ScheduleBlockInstance> ScheduleBlockInstances => 
        _database.GetCollection<ScheduleBlockInstance>("scheduleBlockInstances");
    public IMongoCollection<ScheduleBlockHistory> ScheduleBlockHistories => 
        _database.GetCollection<ScheduleBlockHistory>("scheduleBlockHistories");

    // Better Today collections
    public IMongoCollection<BetterItem> BetterItems => 
        _database.GetCollection<BetterItem>("betterItems");
    public IMongoCollection<BetterItemEvent> BetterItemEvents => 
        _database.GetCollection<BetterItemEvent>("betterItemEvents");

    // Tasks collection
    public IMongoCollection<POS.Core.Entities.Tasks.Task> Tasks => 
        _database.GetCollection<POS.Core.Entities.Tasks.Task>("tasks");

    // Discipline collections
    public IMongoCollection<HabitDefinition> HabitDefinitions => 
        _database.GetCollection<HabitDefinition>("habitDefinitions");
    public IMongoCollection<DisciplineEntry> DisciplineEntries => 
        _database.GetCollection<DisciplineEntry>("disciplineEntries");
    public IMongoCollection<HabitInsight> HabitInsights => 
        _database.GetCollection<HabitInsight>("habitInsights");

    // Diet collections
    public IMongoCollection<DietRuleSet> DietRuleSets => 
        _database.GetCollection<DietRuleSet>("dietRuleSets");
    public IMongoCollection<DietEntry> DietEntries => 
        _database.GetCollection<DietEntry>("dietEntries");

    // Money collections
    public IMongoCollection<IncomeEntry> IncomeEntries => 
        _database.GetCollection<IncomeEntry>("incomeEntries");
    public IMongoCollection<MoneyInsight> MoneyInsights => 
        _database.GetCollection<MoneyInsight>("moneyInsights");

    // Deadlines collections
    public IMongoCollection<Deadline> Deadlines => 
        _database.GetCollection<Deadline>("deadlines");
    public IMongoCollection<DeadlineStatusSnapshot> DeadlineStatusSnapshots => 
        _database.GetCollection<DeadlineStatusSnapshot>("deadlineStatusSnapshots");

    // Weekly Review collection
    public IMongoCollection<WeeklyReview> WeeklyReviews => 
        _database.GetCollection<WeeklyReview>("weeklyReviews");

    // AI Input collection
    public IMongoCollection<AIInput> AIInputs => 
        _database.GetCollection<AIInput>("aiInputs");

    // Categories collection (global, not user-specific)
    public IMongoCollection<Category> Categories => 
        _database.GetCollection<Category>("categories");

    // CBT collections
    public IMongoCollection<CBTEntry> CBTEntries => 
        _database.GetCollection<CBTEntry>("cbtEntries");
    public IMongoCollection<MoodEntry> MoodEntries => 
        _database.GetCollection<MoodEntry>("moodEntries");
    public IMongoCollection<BehavioralActivity> BehavioralActivities => 
        _database.GetCollection<BehavioralActivity>("behavioralActivities");

    // Notification collections
    public IMongoCollection<Notification> Notifications => 
        _database.GetCollection<Notification>("notifications");
    public IMongoCollection<NotificationSettings> NotificationSettings => 
        _database.GetCollection<NotificationSettings>("notificationSettings");

    // Phone Unlock collection
    public IMongoCollection<PhoneUnlockEntry> PhoneUnlockEntries => 
        _database.GetCollection<PhoneUnlockEntry>("phoneUnlockEntries");
}
