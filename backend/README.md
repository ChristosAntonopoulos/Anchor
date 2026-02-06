# Personal Operating System - Data API

## Overview

This is the **Data API** backend for the Personal Operating System (POS). It provides RESTful endpoints for CRUD operations on all data entities.

**Important**: This API handles **data operations only**. All AI processing, scheduled jobs, and data refinement are handled by a separate [AI & Scheduling Service](./AI_SCHEDULING_PROJECT_INSTRUCTIONS.md).

---

## Architecture

- **Runtime**: .NET 9
- **Language**: C#
- **Database**: MongoDB
- **Framework**: ASP.NET Core Web API
- **Architecture**: Clean Architecture (Core, Application, Infrastructure, API layers)

---

## Project Structure

```
backend/src/
├── POS.Api/              # API layer (controllers, middleware, Program.cs)
├── POS.Application/      # Application layer (services, DTOs, validators, mappings)
├── POS.Core/             # Domain layer (entities, repositories, exceptions)
├── POS.Infrastructure/   # Infrastructure layer (MongoDB, repositories)
└── POS.Shared/           # Shared utilities (results, logging)
```

---

## API Endpoints

### Today Data
- `GET /api/today` - Get today's aggregated data
- `POST /api/better-items/complete` - Complete a better item
- `POST /api/better-items/accept` - Accept a better item
- `POST /api/better-items/edit` - Edit a better item
- `POST /api/better-items/reject` - Reject a better item

### Tasks
- `GET /api/tasks` - Get today's tasks
- `POST /api/tasks` - Create a task
- `POST /api/tasks/{id}/complete` - Complete a task
- `DELETE /api/tasks/{id}` - Delete a task

### Schedule
- `GET /api/schedule` - Get today's schedule blocks
- `POST /api/schedule/definitions` - Create schedule block definition
- `PUT /api/schedule/{id}` - Update schedule block
- `DELETE /api/schedule/{id}` - Delete schedule block

### Discipline
- `GET /api/discipline` - Get today's discipline entry
- `PUT /api/discipline` - Update discipline entry

### Diet
- `GET /api/diet` - Get today's diet entry
- `PUT /api/diet` - Update diet entry

### Money
- `GET /api/money/summary` - Get money summary for current month
- `GET /api/money/income` - Get all income entries
- `POST /api/money/income` - Create income entry

### Deadlines
- `GET /api/deadlines` - Get all active deadlines
- `POST /api/deadlines` - Create a deadline
- `PUT /api/deadlines/{id}` - Update a deadline
- `DELETE /api/deadlines/{id}` - Delete a deadline

### Weekly Review
- `GET /api/weekly-review` - Get current weekly review
- `POST /api/weekly-review/submit` - Submit weekly review answers

### Health
- `GET /api/health` - Health check endpoint

---

## Data Models

All entities are stored in MongoDB. Key entities include:

- **Day** - Daily anchor entity
- **BetterItem** - Daily focus items
- **Task** - Daily execution tasks
- **ScheduleBlock** - Time blocks for daily rhythm
- **DisciplineEntry** - Daily habit tracking
- **DietEntry** - Daily diet compliance
- **IncomeEntry** - Income events
- **Deadline** - Active deadlines
- **WeeklyReview** - Weekly reflection
- **AIJobRun** - AI job execution audit logs

See `src/POS.Core/Entities/` for full entity definitions.

---

## Configuration

### appsettings.json

```json
{
  "ConnectionStrings": {
    "MongoDb": "mongodb://localhost:27017"
  },
  "MongoDb": {
    "DatabaseName": "pos"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information"
    }
  }
}
```

### Environment Variables

- `MongoDb__ConnectionString` - MongoDB connection string
- `MongoDb__DatabaseName` - Database name (default: "pos")

---

## Development

### Prerequisites

- .NET 9 SDK
- MongoDB (local or remote)

### Running Locally

```bash
cd backend/src/POS.Api
dotnet run
```

API will be available at `https://localhost:5001` (or configured port).

### Building

```bash
cd backend
dotnet build
```

### Swagger/OpenAPI

When running in Development mode, Swagger UI is available at:
- `https://localhost:5001/swagger`

---

## Database Indexes

The following indexes are automatically created on startup:

- **Users**: `UserId`
- **Days**: `UserId + Date` (unique)
- **BetterItems**: `UserId + Date`
- **Tasks**: `UserId + Date`
- **DisciplineEntries**: `UserId + Date` (unique)
- **DietEntries**: `UserId + Date` (unique)
- **ScheduleBlockInstances**: `UserId + Date`
- **WeeklyReviews**: `UserId + WeekId` (unique)
- **Deadlines**: `UserId + DueDate`
- **IncomeEntries**: `UserId + Date` (descending)
- **AIJobRuns**: `UserId + JobType + StartedAt` (descending)

---

## Authentication

**Current Status**: Placeholder implementation using `default-user-id`.

**TODO**: Implement proper JWT authentication or OAuth2.

See `src/POS.Api/Controllers/BaseController.cs` for current implementation.

---

## AI & Scheduling

All AI processing and scheduled jobs are handled by a **separate service**.

See [AI_SCHEDULING_PROJECT_INSTRUCTIONS.md](./AI_SCHEDULING_PROJECT_INSTRUCTIONS.md) for comprehensive instructions on building the AI & Scheduling service.

**This API does NOT**:
- Execute AI prompts
- Run scheduled jobs
- Generate Better Items automatically
- Analyze data patterns
- Send notifications

**This API DOES**:
- Store and retrieve all data
- Provide CRUD operations
- Validate requests
- Handle errors gracefully
- Log operations

---

## Error Handling

- Global exception middleware handles all unhandled exceptions
- Custom exceptions: `NotFoundException`, `ValidationException`, `BusinessException`
- Standardized API response format: `ApiResponse<T>`
- FluentValidation for request validation

---

## Logging

- **Serilog** for structured logging
- Console and file sinks configured
- Request logging enabled
- Error logging with full context

---

## Testing

**Status**: Not yet implemented.

Planned:
- Unit tests for services
- Integration tests for controllers
- Repository tests

---

## Deployment

**Status**: Not yet deployed.

Planned:
- Docker containerization
- Environment-specific configurations
- Health check endpoints
- Monitoring integration

---

## Contributing

1. Follow Clean Architecture principles
2. Keep controllers thin - delegate to services
3. Use DTOs for all API contracts
4. Validate all inputs with FluentValidation
5. Log all operations appropriately
6. Handle errors gracefully

---

## License

[Your License Here]
