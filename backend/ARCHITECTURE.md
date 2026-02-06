# Backend Architecture Documentation

## Overview

This document describes the architecture decisions and patterns used in the POS (Personal Operating System) backend API.

## Architecture Layers

The application follows a layered architecture:

```
┌─────────────────────────────────────┐
│         API Layer (Controllers)     │  ← HTTP endpoints, request/response handling
├─────────────────────────────────────┤
│    Application Layer (Services)     │  ← Business logic, orchestration
├─────────────────────────────────────┤
│  Infrastructure Layer (Data Access)│  ← MongoDB context, repositories
├─────────────────────────────────────┤
│           MongoDB Database          │  ← Data persistence
└─────────────────────────────────────┘
```

### API Layer

**Location**: `backend/src/POS.Api/Controllers/`

- Thin controllers that delegate to services
- Handle HTTP concerns (routing, status codes, validation)
- Use DTOs for request/response
- Inherit from `BaseController` for common functionality

**Example**:
```csharp
[ApiController]
[Route("api/[controller]")]
public class MoneyController : BaseController
{
    private readonly MoneyService _moneyService;
    
    [HttpGet("summary")]
    public async Task<IActionResult> GetMoneySummary()
    {
        var userId = GetUserId();
        var summary = await _moneyService.GetMoneySummaryAsync(userId);
        return Ok(summary);
    }
}
```

### Application Layer

**Location**: `backend/src/POS.Application/Services/`

- Contains business logic and orchestration
- Uses DTOs for data transfer
- Depends on infrastructure layer for data access
- Services are scoped per request

**Example**:
```csharp
public class MoneyService
{
    private readonly MongoDbContext _context;
    
    public async Task<MoneySummaryDto> GetMoneySummaryAsync(string userId)
    {
        // Business logic here
        var incomeEntries = await _context.IncomeEntries
            .Find(filter)
            .ToListAsync();
        // ... compute summary
    }
}
```

### Infrastructure Layer

**Location**: `backend/src/POS.Infrastructure/`

- Data access implementation
- MongoDB context and configuration
- Repository implementations (when used)
- Database seeding

## Data Access Pattern

### Direct MongoDbContext Access

**Current Approach**: Services use `MongoDbContext` directly for data access.

**Why**:
- MongoDB queries are straightforward and readable
- Direct access provides flexibility for complex queries
- No need for abstraction layer when using a single database
- MongoDB driver provides excellent LINQ support
- Reduces indirection and improves code clarity

**Example**:
```csharp
public class MoneyService
{
    private readonly MongoDbContext _context;
    
    public async Task<List<IncomeEntryDto>> GetAllIncomeAsync(string userId)
    {
        var filter = Builders<IncomeEntry>.Filter.Eq(i => i.UserId, userId);
        var incomeEntries = await _context.IncomeEntries
            .Find(filter)
            .SortByDescending(i => i.Date)
            .ToListAsync();
        return _mapper.Map<List<IncomeEntryDto>>(incomeEntries);
    }
}
```

### Repository Pattern

**Status**: Repository infrastructure exists but is underutilized.

**Location**: 
- Interface: `backend/src/POS.Core/Repositories/IRepository.cs`
- Implementation: `backend/src/POS.Infrastructure/Repositories/MongoRepository.cs`

**When to Use Repositories**:
- If we need to support multiple databases (SQL, NoSQL, etc.)
- If we need complex query abstractions
- If we need to significantly improve testability with mocks
- If we need to add cross-cutting concerns (caching, logging) at data access level

**Current Usage**:
- `BaseService` uses repositories, but most services don't inherit from it
- Only a few core entities have repositories registered (`User`, `Day`, `AIJobRun`)
- Most services use `MongoDbContext` directly

**Decision**: Keep direct context access for now. If requirements change (multiple databases, complex abstractions), migrate to repositories.

## Entity Design

### Entity Hierarchy

```
EntityBase
├── Id (string)
├── UserId (string)
├── CreatedAt (DateTime)
└── UpdatedAt (DateTime)
    │
    ├── DayAnchoredEntity
    │   ├── Date (DateTime)
    │   └── DayId (computed: {UserId}_{Date:yyyy-MM-dd})
    │       │
    │       ├── Day
    │       ├── BetterItem
    │       ├── Task
    │       ├── ScheduleBlockInstance
    │       ├── DisciplineEntry
    │       ├── DietEntry
    │       ├── ScheduleBlockHistory
    │       ├── DeadlineStatusSnapshot
    │       └── IncomeEntry
    │
    └── DefinitionEntity
        ├── Enabled (bool)
        ├── Priority (int)
        │
        ├── ScheduleBlockDefinition
        └── HabitDefinition
```

### Day-Anchored Entities

Entities that extend `DayAnchoredEntity` represent data tied to a specific day:
- Have a `Date` field (date-only, no time)
- Have a computed `DayId` property for composite keys
- Typically queried by `UserId` and `Date`
- Examples: `BetterItem`, `Task`, `DisciplineEntry`, `IncomeEntry`

### Standalone Entities

Entities that extend `EntityBase` directly:
- Not tied to a specific day
- May have their own date fields (e.g., `Deadline.DueDate`)
- Examples: `User`, `Deadline`, `WeeklyReview`, `AIJobRun`

## AI Service Only Entities

Some entities are defined but not used by the Data API. These are reserved for the **AI & Scheduling Service**:

- `BetterItemEvent` - Audit log for better item changes
- `ScheduleBlockHistory` - Completion tracking for schedule blocks
- `DeadlineStatusSnapshot` - Daily deadline status tracking
- `HabitDefinition` - Template for habit generation
- `HabitInsight` - Weekly AI-generated habit insights
- `DietRuleSet` - Diet compliance rules
- `MoneyInsight` - Weekly AI-generated money trend insights

**Note**: These entities may be empty until the AI service is implemented. See entity XML comments for details.

## Dependency Injection

### Service Registration

Services are registered in `Program.cs`:
```csharp
builder.Services.AddScoped<MoneyService>();
builder.Services.AddScoped<TodayService>();
// ... other services
```

### Data Access Registration

MongoDB is configured via extension method:
```csharp
builder.Services.AddMongoDb(builder.Configuration);
```

This registers:
- `IMongoDatabase` (singleton)
- `MongoDbContext` (scoped)
- Repositories (scoped, for entities that use them)

## Error Handling

### Exception Types

- `NotFoundException` - Entity not found
- Custom exceptions in `POS.Core.Exceptions`

### Error Responses

Controllers return appropriate HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation errors
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

## Logging

All services use `ILogger<T>` for logging:
- Information level for normal operations
- Warning level for expected issues (e.g., not found)
- Error level for exceptions

## Testing Strategy

### Unit Tests
- Test services with mocked `MongoDbContext`
- Test business logic in isolation

### Integration Tests
- Test API endpoints with test database
- Verify data persistence and retrieval

## Future Considerations

### Potential Improvements

1. **Repository Pattern Migration**: If we need to support multiple databases
2. **Caching Layer**: Add caching for frequently accessed data
3. **Event Sourcing**: Consider for audit trails (BetterItemEvent, etc.)
4. **CQRS**: Separate read/write models if needed for performance

### When to Revisit Architecture

- Need to support multiple databases
- Performance issues requiring caching
- Complex query abstractions needed
- Significant increase in test complexity

## Related Documentation

- `SCHEMA_ANALYSIS.md` - Database schema analysis
- `SCHEMA_IMPROVEMENTS_PLAN.md` - Schema improvement plan
- `AI_SCHEDULING_PROJECT_INSTRUCTIONS.md` - AI service integration guide
