using System.Reflection;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using POS.Api.Middleware;
using POS.Application.Mappings;
using POS.Application.Services.BetterToday;
using POS.Application.Services.Deadlines;
using POS.Application.Services.Diet;
using POS.Application.Services.Discipline;
using POS.Application.Services.Money;
using POS.Application.Services.Schedule;
using POS.Application.Services.Tasks;
using POS.Application.Services.Today;
using POS.Application.Services.WeeklyReview;
using POS.Application.Services.AIInput;
using POS.Application.Services.Category;
using POS.Application.Services.CBT;
using POS.Application.Services.Notifications;
using POS.Application.Validators.BetterToday;
using POS.Application.Validators.Deadlines;
using POS.Application.Validators.Money;
using POS.Application.Validators.Schedule;
using POS.Application.Validators.Tasks;
using POS.Application.Validators.WeeklyReview;
using POS.Core.Configuration;
using POS.Infrastructure.Data;
using POS.Infrastructure.Data.Seeders;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = false;
    });

// Configure MongoDB
builder.Services.AddMongoDb(builder.Configuration);

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(BaseMappingProfile).Assembly);

// Configure FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(typeof(CreateScheduleBlockDefinitionValidator).Assembly);

// Register services
builder.Services.AddScoped<TodayService>();
builder.Services.AddScoped<ScheduleService>();
builder.Services.AddScoped<BetterItemService>();
builder.Services.AddScoped<TaskService>();
builder.Services.AddScoped<DisciplineService>();
builder.Services.AddScoped<DietService>();
builder.Services.AddScoped<MoneyService>();
builder.Services.AddScoped<DeadlineService>();
builder.Services.AddScoped<WeeklyReviewService>();
builder.Services.AddScoped<AIInputService>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<CBTService>();
builder.Services.AddScoped<NotificationService>();

// Register database seeder
builder.Services.AddScoped<DataSeeder>();

// Configure database settings
builder.Services.Configure<DatabaseSettings>(
    builder.Configuration.GetSection("Database"));

// Configure API behavior
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errorDetails = context.ModelState
            .Where(x => x.Value?.Errors.Count > 0)
            .SelectMany(x => x.Value!.Errors.Select(error => new POS.Shared.Results.ErrorDetail
            {
                Field = x.Key,
                Message = error.ErrorMessage
            }))
            .ToList();

        var response = POS.Shared.Results.ApiResponse.ErrorResponse("Validation failed", errorDetails);
        return new BadRequestObjectResult(response);
    };
});

// Configure CORS for mobile app
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // In development, allow all origins for mobile device testing
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            // In production, allow all origins for mobile app access
            // Production server: http://185.193.66.50:35555
            // Expo Go uses dynamic IPs and various origins depending on device and network
            // This is acceptable for mobile API access (no browser-based attacks)
            // Consider adding rate limiting and authentication for additional security
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
            
            // Alternative: Use specific origins (more secure but may break on some networks)
            // Uncomment and configure if you want to restrict origins:
            // policy.WithOrigins(
            //     "http://localhost:8081",
            //     "http://localhost:19006",
            //     "exp://localhost:8081",
            //     "exp://localhost:19006"
            //   )
            //   .AllowAnyMethod()
            //   .AllowAnyHeader()
            //   .SetIsOriginAllowed(origin => 
            //       origin.Contains("exp://") ||
            //       origin.Contains("192.168.") ||
            //       origin.Contains("10.0."));
        }
    });
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Personal Operating System API",
        Version = "v1",
        Description = @"
RESTful API for Personal Operating System (POS) mobile app.

This API provides full CRUD operations for all data entities including:
- Better Items (daily focus items)
- Tasks (execution items)
- Schedule Blocks (time management)
- Discipline Entries (habit tracking)
- Diet Entries (diet compliance)
- Income Entries (money tracking)
- Deadlines (commitment tracking)
- Weekly Reviews (reflection)
- CBT Entries (cognitive behavioral therapy)
- Notifications (app notifications)

All endpoints return standardized ApiResponse<T> format.
Date parameters should be in YYYY-MM-DD format.
        ",
        Contact = new OpenApiContact
        {
            Name = "POS API Support"
        }
    });
    
    // Include XML comments from API project
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
    
    // Include XML comments from Application layer (for DTOs)
    var applicationXmlFile = "POS.Application.xml";
    var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, applicationXmlFile);
    if (File.Exists(applicationXmlPath))
    {
        c.IncludeXmlComments(applicationXmlPath);
    }
    
    // Enable annotations for better Swagger generation
    c.EnableAnnotations();
    
    // Use fully qualified type names for schema IDs to avoid conflicts between types with same name in different namespaces
    c.CustomSchemaIds(type => type.FullName?.Replace("+", ".") ?? type.Name);
    
    // Group endpoints by controller name (tags)
    c.TagActionsBy(api => new[] { api.GroupName ?? api.ActionDescriptor.RouteValues["controller"] ?? "Default" });
    c.DocInclusionPredicate((name, api) => true);
});

var app = builder.Build();

// Configure the HTTP request pipeline
// Enable Swagger only in Development (disabled in Production for security)
// Can be overridden via EnableSwagger config setting if needed
var enableSwagger = builder.Configuration.GetValue<bool>("EnableSwagger", app.Environment.IsDevelopment());
// Explicitly disable in Production even if config says otherwise (security best practice)
if (app.Environment.IsProduction())
{
    enableSwagger = false;
}
if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "POS API v1");
        c.RoutePrefix = "swagger"; // Swagger UI at /swagger
        c.DocumentTitle = "POS API Documentation";
        c.DefaultModelsExpandDepth(-1); // Hide schemas by default
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List); // Expand endpoints list
        c.EnableDeepLinking();
        c.EnableFilter();
        c.ShowExtensions();
        c.EnableValidator();
        // Enable network access - use relative paths so it works with IP addresses
        c.ConfigObject.Urls = new[] { new Swashbuckle.AspNetCore.SwaggerUI.UrlDescriptor { Name = "POS API v1", Url = "/swagger/v1/swagger.json" } };
    });
}

// Use Serilog request logging
app.UseSerilogRequestLogging();

// Use exception handling middleware (must be early in pipeline)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Only redirect to HTTPS in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Use CORS
app.UseCors();

// Map controllers
app.MapControllers();

// Auto-seed database on startup if enabled and database doesn't exist
try
{
    using var scope = app.Services.CreateScope();
    var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    
    // Read auto-seed configuration
    var databaseSettings = configuration.GetSection("Database").Get<DatabaseSettings>();
    var autoSeedEnabled = databaseSettings?.AutoSeedOnStartup ?? false;
    
    if (!autoSeedEnabled)
    {
        logger.LogInformation("Auto-seeding is disabled in configuration. Skipping auto-seed.");
    }
        else
        {
            // Check if database is already seeded
            var isSeeded = await seeder.IsSeededAsync();
            
            if (isSeeded)
            {
                logger.LogInformation("Database is already seeded with valid data. Skipping auto-seed.");
            }
            else
            {
                // Check if collections exist but are empty, or have old data
                var hasEmptyCollections = await seeder.HasEmptyCollectionsAsync();
                var hasOldData = await seeder.HasOldDataAsync();
                
                if (hasEmptyCollections)
                {
                    logger.LogInformation("Database exists but collections are empty. Seeding with initial data...");
                    // Seed without deleting (collections are already empty)
                    await seeder.SeedAsync(deleteExisting: false);
                }
                else if (hasOldData)
                {
                    logger.LogInformation("Database has old/invalid data. Cleaning and reseeding...");
                    // Delete old data and seed fresh
                    if (app.Environment.IsDevelopment())
                    {
                        // In development, clean all collections
                        await seeder.DeleteAllCollectionsAsync();
                        await seeder.SeedAsync();
                    }
                    else
                    {
                        // In production, delete user data and reseed
                        await seeder.SeedAsync(deleteExisting: true);
                    }
                }
                else
                {
                    logger.LogInformation("Database is not seeded. Starting auto-seeding...");
                    
                    // In development, clean all collections first to remove old structure data
                    // In production, just seed without deleting (safer)
                    if (app.Environment.IsDevelopment())
                    {
                        logger.LogInformation("Development mode: Cleaning all collections before seeding...");
                        await seeder.DeleteAllCollectionsAsync();
                        // Seed with deleteExisting=true (default) since we already deleted
                        await seeder.SeedAsync();
                    }
                    else
                    {
                        logger.LogInformation("Production mode: Seeding without deleting existing data...");
                        // Seed without deleting existing data in production
                        await seeder.SeedAsync(deleteExisting: false);
                    }
                }
                
                logger.LogInformation("Database auto-seeding completed successfully. Set 'Database:AutoSeedOnStartup' to false to disable.");
            }
        }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Error during auto-seeding on startup. Application will continue without seeded data.");
    // Don't throw - allow app to start even if seeding fails
}

app.Run();
