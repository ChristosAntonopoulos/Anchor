using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;
using POS.Core.Entities.CBT;
using POS.Core.Entities.Deadlines;
using POS.Core.Entities.Schedule;
using TaskEntity = POS.Core.Entities.Tasks.Task;
using POS.Core.Entities;
using POS.Core.Entities.BetterToday;
using POS.Core.Entities.Deadlines;
using POS.Core.Entities.Diet;
using POS.Core.Entities.Discipline;
using POS.Core.Entities.Money;
using POS.Core.Entities.Schedule;
using POS.Core.Entities.Tasks;
using POS.Core.Entities.WeeklyReview;
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

        // Additional repositories will be registered as entities are created
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
