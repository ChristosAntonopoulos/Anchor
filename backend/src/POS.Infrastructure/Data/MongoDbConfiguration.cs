using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;
using POS.Core.Entities;
using POS.Core.Entities.AIBrief;
using POS.Core.Entities.BetterToday;
using POS.Core.Entities.CBT;
using POS.Core.Entities.Deadlines;
using POS.Core.Entities.Diet;
using POS.Core.Entities.Discipline;
using POS.Core.Entities.Meals;
using POS.Core.Entities.Money;
using POS.Core.Entities.Schedule;
using POS.Core.Entities.WeeklyReview;
using TaskEntity = POS.Core.Entities.Tasks.Task;
using POS.Core.Repositories;
using POS.Infrastructure.Repositories;

namespace POS.Infrastructure.Data;

/// <summary>
/// MongoDB configuration and setup
/// </summary>
public static class MongoDbConfiguration
{
    private static bool _conventionsRegistered;

    static MongoDbConfiguration()
    {
        RegisterBsonConventions();
    }

    /// <summary>
    /// Botsystem data.save adds metadata (e.g. botRunId) not mapped on POS entities.
    /// </summary>
    private static void RegisterBsonConventions()
    {
        if (_conventionsRegistered)
            return;

        var pack = new ConventionPack { new IgnoreExtraElementsConvention(true) };
        ConventionRegistry.Register("PosIgnoreExtraElements", pack, _ => true);

        // Botsystem data.save adds botRunId/createdUtc — ensure intake collections ignore extras
        RegisterIgnoreExtraElements<BehavioralActivity>();
        RegisterIgnoreExtraElements<MoodEntry>();
        RegisterIgnoreExtraElements<CBTEntry>();
        RegisterIgnoreExtraElements<TaskEntity>();
        RegisterIgnoreExtraElements<ScheduleBlockInstance>();
        RegisterIgnoreExtraElements<Deadline>();

        _conventionsRegistered = true;
    }

    private static void RegisterIgnoreExtraElements<T>()
    {
        if (BsonClassMap.IsClassMapRegistered(typeof(T)))
            return;

        BsonClassMap.RegisterClassMap<T>(cm =>
        {
            cm.AutoMap();
            cm.SetIgnoreExtraElements(true);
        });
    }

    public static IServiceCollection AddMongoDb(
        this IServiceCollection services,
        IConfiguration configuration) =>
        AddMongoDbCore(services, configuration, contextAsSingleton: false);

    /// <summary>
    /// Same as <see cref="AddMongoDb"/> but registers <see cref="MongoDbContext"/> as a singleton
    /// for long-running worker hosts (no HTTP request scope).
    /// </summary>
    public static IServiceCollection AddMongoDbForWorker(
        this IServiceCollection services,
        IConfiguration configuration) =>
        AddMongoDbCore(services, configuration, contextAsSingleton: true);

    private static IServiceCollection AddMongoDbCore(
        IServiceCollection services,
        IConfiguration configuration,
        bool contextAsSingleton)
    {
        var connectionString = NormalizeConnectionString(
            configuration.GetConnectionString("MongoDb") ?? "mongodb://127.0.0.1:27017");
        var databaseName = configuration["MongoDb:DatabaseName"] ?? "pos";
        var startupMaxWaitSeconds = int.TryParse(configuration["MongoDb:StartupMaxWaitSeconds"], out var maxWait)
            ? maxWait
            : 0;

        if (startupMaxWaitSeconds > 0)
            WaitForMongo(connectionString, startupMaxWaitSeconds);

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);

        services.AddSingleton<IMongoDatabase>(database);
        if (contextAsSingleton)
            services.AddSingleton<MongoDbContext>();
        else
            services.AddScoped<MongoDbContext>();

        RegisterRepositories(services, database);
        CreateIndexes(database);

        return services;
    }

    private static void RegisterRepositories(IServiceCollection services, IMongoDatabase database)
    {
        // Core repositories
        services.AddScoped<IRepository<User>>(sp =>
            new MongoRepository<User>(database.GetCollection<User>("users")));
        services.AddScoped<IRepository<Day>>(sp =>
            new MongoRepository<Day>(database.GetCollection<Day>("days")));
        services.AddScoped<IRepository<AIJobRun>>(sp =>
            new MongoRepository<AIJobRun>(database.GetCollection<AIJobRun>("aiJobRuns")));

        // BetterToday
        services.AddScoped<IRepository<BetterItem>>(sp =>
            new MongoRepository<BetterItem>(database.GetCollection<BetterItem>("betterItems")));

        // Tasks
        services.AddScoped<IRepository<POS.Core.Entities.Tasks.Task>>(sp =>
            new MongoRepository<POS.Core.Entities.Tasks.Task>(database.GetCollection<POS.Core.Entities.Tasks.Task>("tasks")));

        // Discipline
        services.AddScoped<IDayAnchoredRepository<DisciplineEntry>>(sp =>
            new DayAnchoredRepository<DisciplineEntry>(database.GetCollection<DisciplineEntry>("disciplineEntries")));

        // Diet
        services.AddScoped<IDayAnchoredRepository<DietEntry>>(sp =>
            new DayAnchoredRepository<DietEntry>(database.GetCollection<DietEntry>("dietEntries")));

        // Schedule
        services.AddScoped<IRepository<ScheduleBlockInstance>>(sp =>
            new MongoRepository<ScheduleBlockInstance>(database.GetCollection<ScheduleBlockInstance>("scheduleBlockInstances")));
        services.AddScoped<IRepository<ScheduleBlockDefinition>>(sp =>
            new MongoRepository<ScheduleBlockDefinition>(database.GetCollection<ScheduleBlockDefinition>("scheduleBlockDefinitions")));

        // Money
        services.AddScoped<IRepository<IncomeEntry>>(sp =>
            new MongoRepository<IncomeEntry>(database.GetCollection<IncomeEntry>("incomeEntries")));
        services.AddScoped<IRepository<WalletSpend>>(sp =>
            new MongoRepository<WalletSpend>(database.GetCollection<WalletSpend>("walletSpends")));

        // Deadlines
        services.AddScoped<IRepository<Deadline>>(sp =>
            new MongoRepository<Deadline>(database.GetCollection<Deadline>("deadlines")));

        // Weekly Review
        services.AddScoped<IRepository<WeeklyReview>>(sp =>
            new MongoRepository<WeeklyReview>(database.GetCollection<WeeklyReview>("weeklyReviews")));

        // AI Brief (written by BotSystem's day-start bot)
        services.AddScoped<IDayAnchoredRepository<POS.Core.Entities.AIBrief.DayStartPlan>>(sp =>
            new DayAnchoredRepository<POS.Core.Entities.AIBrief.DayStartPlan>(
                database.GetCollection<POS.Core.Entities.AIBrief.DayStartPlan>("dayStartPlans")));

        // Meals
        services.AddScoped<IRepository<FoodProfile>>(sp =>
            new MongoRepository<FoodProfile>(database.GetCollection<FoodProfile>("mealFoodProfiles")));
        services.AddScoped<IRepository<Ingredient>>(sp =>
            new MongoRepository<Ingredient>(database.GetCollection<Ingredient>("mealIngredients")));
        services.AddScoped<IRepository<InventoryBatch>>(sp =>
            new MongoRepository<InventoryBatch>(database.GetCollection<InventoryBatch>("mealInventoryBatches")));
        services.AddScoped<IRepository<InventoryMovement>>(sp =>
            new MongoRepository<InventoryMovement>(database.GetCollection<InventoryMovement>("mealInventoryMovements")));
        services.AddScoped<IRepository<RecipeVersion>>(sp =>
            new MongoRepository<RecipeVersion>(database.GetCollection<RecipeVersion>("mealRecipeVersions")));
        services.AddScoped<IRepository<MealPlan>>(sp =>
            new MongoRepository<MealPlan>(database.GetCollection<MealPlan>("mealPlans")));
        services.AddScoped<IRepository<ShoppingTrip>>(sp =>
            new MongoRepository<ShoppingTrip>(database.GetCollection<ShoppingTrip>("mealShoppingTrips")));
        services.AddScoped<IRepository<CookEvent>>(sp =>
            new MongoRepository<CookEvent>(database.GetCollection<CookEvent>("mealCookEvents")));
        services.AddScoped<IRepository<PreferenceMemory>>(sp =>
            new MongoRepository<PreferenceMemory>(database.GetCollection<PreferenceMemory>("mealPreferenceMemories")));
    }

    private static void CreateIndexes(IMongoDatabase database)
    {
        // User indexes
        var usersCollection = database.GetCollection<User>("users");
        usersCollection.Indexes.CreateOne(
            new CreateIndexModel<User>(Builders<User>.IndexKeys.Ascending(x => x.UserId)));

        // Day indexes - compound index on UserId and Date
        var daysCollection = database.GetCollection<Day>("days");
        daysCollection.Indexes.CreateOne(
            new CreateIndexModel<Day>(
                Builders<Day>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.Date),
                new CreateIndexOptions { Unique = true }));

        // AIJobRun indexes
        var aiJobRunsCollection = database.GetCollection<AIJobRun>("aiJobRuns");
        aiJobRunsCollection.Indexes.CreateOne(
            new CreateIndexModel<AIJobRun>(
                Builders<AIJobRun>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.JobType).Descending(x => x.StartedAt)));

        // AIInput indexes - for worker polling
        var aiInputsCollection = database.GetCollection<POS.Core.Entities.AIInput.AIInput>("aiInputs");
        aiInputsCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.AIInput.AIInput>(
                Builders<POS.Core.Entities.AIInput.AIInput>.IndexKeys.Ascending(x => x.Status).Ascending(x => x.CreatedAt)));

        // BetterItems indexes - compound index on UserId and Date
        var betterItemsCollection = database.GetCollection<POS.Core.Entities.BetterToday.BetterItem>("betterItems");
        betterItemsCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.BetterToday.BetterItem>(
                Builders<POS.Core.Entities.BetterToday.BetterItem>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.Date)));

        // Tasks indexes - focus + inbox queries
        var tasksCollection = database.GetCollection<POS.Core.Entities.Tasks.Task>("tasks");
        tasksCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Tasks.Task>(
                Builders<POS.Core.Entities.Tasks.Task>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.Date)));
        tasksCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Tasks.Task>(
                Builders<POS.Core.Entities.Tasks.Task>.IndexKeys
                    .Ascending(x => x.UserId)
                    .Ascending(x => x.Status)
                    .Ascending(x => x.PlannedDate)));

        // DisciplineEntries indexes - compound unique index on UserId and Date
        var disciplineEntriesCollection = database.GetCollection<POS.Core.Entities.Discipline.DisciplineEntry>("disciplineEntries");
        disciplineEntriesCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Discipline.DisciplineEntry>(
                Builders<POS.Core.Entities.Discipline.DisciplineEntry>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.Date),
                new CreateIndexOptions { Unique = true }));

        // DietEntries indexes - compound unique index on UserId and Date
        var dietEntriesCollection = database.GetCollection<POS.Core.Entities.Diet.DietEntry>("dietEntries");
        dietEntriesCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Diet.DietEntry>(
                Builders<POS.Core.Entities.Diet.DietEntry>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.Date),
                new CreateIndexOptions { Unique = true }));

        // ScheduleBlockInstances indexes - compound index on UserId and Date
        var scheduleBlockInstancesCollection = database.GetCollection<POS.Core.Entities.Schedule.ScheduleBlockInstance>("scheduleBlockInstances");
        scheduleBlockInstancesCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Schedule.ScheduleBlockInstance>(
                Builders<POS.Core.Entities.Schedule.ScheduleBlockInstance>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.Date)));

        var morningSessions = database.GetCollection<POS.Core.Entities.Morning.MorningModeSession>("morningModeSessions");
        morningSessions.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Morning.MorningModeSession>(
                Builders<POS.Core.Entities.Morning.MorningModeSession>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.LocalDate),
                new CreateIndexOptions { Unique = true }));

        // WeeklyReviews indexes - compound unique index on UserId and WeekId
        var weeklyReviewsCollection = database.GetCollection<POS.Core.Entities.WeeklyReview.WeeklyReview>("weeklyReviews");
        weeklyReviewsCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.WeeklyReview.WeeklyReview>(
                Builders<POS.Core.Entities.WeeklyReview.WeeklyReview>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.WeekId),
                new CreateIndexOptions { Unique = true }));

        // Deadlines indexes - compound index on UserId and DueDate
        var deadlinesCollection = database.GetCollection<POS.Core.Entities.Deadlines.Deadline>("deadlines");
        deadlinesCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Deadlines.Deadline>(
                Builders<POS.Core.Entities.Deadlines.Deadline>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.DueDate)));

        // IncomeEntries indexes - compound index on UserId and Date (descending for recent first)
        var incomeEntriesCollection = database.GetCollection<POS.Core.Entities.Money.IncomeEntry>("incomeEntries");
        incomeEntriesCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Money.IncomeEntry>(
                Builders<POS.Core.Entities.Money.IncomeEntry>.IndexKeys.Ascending(x => x.UserId).Descending(x => x.Date)));

        var walletSpendsCollection = database.GetCollection<POS.Core.Entities.Money.WalletSpend>("walletSpends");
        walletSpendsCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Money.WalletSpend>(
                Builders<POS.Core.Entities.Money.WalletSpend>.IndexKeys.Ascending(x => x.UserId).Descending(x => x.Date)));
        walletSpendsCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Money.WalletSpend>(
                Builders<POS.Core.Entities.Money.WalletSpend>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.SourceNotificationId),
                new CreateIndexOptions { Unique = true }));

        // DayStartPlans indexes - compound unique index on UserId and Date
        var dayStartPlansCollection = database.GetCollection<POS.Core.Entities.AIBrief.DayStartPlan>("dayStartPlans");
        dayStartPlansCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.AIBrief.DayStartPlan>(
                Builders<POS.Core.Entities.AIBrief.DayStartPlan>.IndexKeys.Ascending(x => x.UserId).Descending(x => x.Date),
                new CreateIndexOptions { Unique = true }));
    }

    /// <summary>
    /// Prefer IPv4 on Windows where localhost may resolve to ::1 while Mongo listens on 127.0.0.1 only.
    /// </summary>
    internal static string NormalizeConnectionString(string connectionString) =>
        connectionString.Replace("localhost", "127.0.0.1", StringComparison.OrdinalIgnoreCase);

    private static string MaskConnectionString(string connectionString)
    {
        if (string.IsNullOrEmpty(connectionString))
            return "(empty)";
        var at = connectionString.IndexOf('@');
        if (at > 0 && connectionString.StartsWith("mongodb://", StringComparison.OrdinalIgnoreCase))
            return "mongodb://***@" + connectionString[(at + 1)..];
        return connectionString;
    }

    internal static void WaitForMongo(string connectionString, int maxWaitSeconds)
    {
        var deadline = DateTime.UtcNow.AddSeconds(maxWaitSeconds);
        Exception? lastError = null;

        while (DateTime.UtcNow < deadline)
        {
            try
            {
                var client = new MongoClient(connectionString);
                client.GetDatabase("admin").RunCommand<BsonDocument>(new BsonDocument("ping", 1));
                return;
            }
            catch (Exception ex)
            {
                lastError = ex;
                Thread.Sleep(TimeSpan.FromSeconds(2));
            }
        }

        throw new InvalidOperationException(
            $"MongoDB is not reachable at '{MaskConnectionString(connectionString)}' after waiting {maxWaitSeconds}s. " +
            "Verify the server is up, firewall allows port 27017, and ConnectionStrings__MongoDb matches POS.Api.",
            lastError);
    }
}
