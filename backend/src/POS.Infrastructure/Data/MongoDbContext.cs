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
}
