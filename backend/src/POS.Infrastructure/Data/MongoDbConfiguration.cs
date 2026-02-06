using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
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
    public static IServiceCollection AddMongoDb(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoDb") 
            ?? "mongodb://localhost:27017";
        var databaseName = configuration["MongoDb:DatabaseName"] ?? "pos";

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);

        // Register MongoDbContext
        services.AddSingleton<IMongoDatabase>(database);
        services.AddScoped<MongoDbContext>();

        // Register repositories
        RegisterRepositories(services, database);

        // Create indexes
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

        // BetterItems indexes - compound index on UserId and Date
        var betterItemsCollection = database.GetCollection<POS.Core.Entities.BetterToday.BetterItem>("betterItems");
        betterItemsCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.BetterToday.BetterItem>(
                Builders<POS.Core.Entities.BetterToday.BetterItem>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.Date)));

        // Tasks indexes - compound index on UserId and Date
        var tasksCollection = database.GetCollection<POS.Core.Entities.Tasks.Task>("tasks");
        tasksCollection.Indexes.CreateOne(
            new CreateIndexModel<POS.Core.Entities.Tasks.Task>(
                Builders<POS.Core.Entities.Tasks.Task>.IndexKeys.Ascending(x => x.UserId).Ascending(x => x.Date)));

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
}
