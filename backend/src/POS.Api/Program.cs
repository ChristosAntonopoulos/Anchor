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
using POS.Application.Validators.BetterToday;
using POS.Application.Validators.Deadlines;
using POS.Application.Validators.Money;
using POS.Application.Validators.Schedule;
using POS.Application.Validators.Tasks;
using POS.Application.Validators.WeeklyReview;
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

// Register database seeder
builder.Services.AddScoped<DataSeeder>();

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
        Description = "API for Personal Operating System mobile app"
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "POS API v1");
        c.RoutePrefix = "swagger"; // Swagger UI at /swagger
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

// Auto-seed database on startup if empty (Development only)
if (app.Environment.IsDevelopment())
{
    try
    {
        using var scope = app.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        var isSeeded = await seeder.IsSeededAsync();
        if (!isSeeded)
        {
            logger.LogInformation("Database is empty. Auto-seeding initial data...");
            await seeder.SeedAsync();
            logger.LogInformation("Database auto-seeding completed successfully.");
        }
        else
        {
            logger.LogInformation("Database already contains data. Skipping auto-seed.");
        }
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error during auto-seeding on startup. Application will continue without seeded data.");
        // Don't throw - allow app to start even if seeding fails
    }
}

app.Run();
