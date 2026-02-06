# Database Migration Plan: From Mock Data to Database

## Overview
This plan outlines the migration from hardcoded/mock data to a fully database-driven system with seeded initial data.

## Current State Analysis

### ✅ What's Already Working
- **Backend Services**: All services query MongoDB correctly
- **Database Entities**: All entities are properly defined
- **API Endpoints**: All endpoints are implemented and working
- **Mobile App**: Already using HTTP API client (not mock data)

### ❌ What Needs to Be Done
- **No Initial Data**: Database is empty, so endpoints return empty arrays/defaults
- **Mock Data Still Exists**: `mobile/services/mockData.ts` exists but isn't used
- **No Seeding Mechanism**: No way to populate database with initial data

## Migration Plan

### Phase 1: Create Database Seeder Infrastructure

#### 1.1 Create Seeder Service
- **Location**: `backend/src/POS.Infrastructure/Data/Seeders/`
- **Purpose**: Centralized seeding logic
- **Structure**:
  ```
  DataSeeder.cs          - Main seeder orchestrator
  UserSeeder.cs          - Seed default user
  DaySeeder.cs           - Seed today's day entity
  BetterItemSeeder.cs    - Seed better items
  TaskSeeder.cs          - Seed tasks
  ScheduleSeeder.cs      - Seed schedule blocks
  DisciplineSeeder.cs    - Seed discipline entries
  DietSeeder.cs          - Seed diet entries
  MoneySeeder.cs         - Seed income entries
  DeadlineSeeder.cs      - Seed deadlines
  WeeklyReviewSeeder.cs  - Seed weekly review
  ```

#### 1.2 Seeder Design Principles
- **Idempotent**: Running seeder multiple times should be safe
- **Configurable**: Can seed for specific user or default user
- **Date-Aware**: Seeds data for today's date
- **Matches Mock Data**: Initial seed matches `mobile/services/mockData.ts`

### Phase 2: Implement Seeders

#### 2.1 User Seeder
- Create default user with ID: `"default-user-id"` (matches current auth placeholder)
- Set timezone to UTC

#### 2.2 Day Seeder
- Create Day entity for today
- Ensure it exists before seeding other day-anchored entities

#### 2.3 Better Items Seeder
Seed for today:
- `b1`: "Finish deadline API endpoint" (work, not completed)
- `b2`: "Send 5 outreach messages" (leverage, not completed)

#### 2.4 Tasks Seeder
Seed for today:
- `t1`: "Fix auth bug" (work, not completed)

#### 2.5 Schedule Seeder
Seed for today:
- `s1`: "Deep Work" (10:00 - 12:00)
- `s2`: "Leverage" (13:00 - 14:30)
- `s3`: "Health" (16:30 - 18:00)

#### 2.6 Discipline Seeder
Seed for today:
- Walk: true
- Diet: true
- Water: true
- Gym: false
- Cooked: false
- Meditation: false

#### 2.7 Diet Seeder
Seed for today:
- Compliant: true

#### 2.8 Money Seeder
Seed income entry:
- Date: 2026-01-30 (6 days ago)
- Source: "Client A"
- Amount: 420
- Currency: "USD"

#### 2.9 Deadline Seeder
Seed deadline:
- Title: "Platform X"
- DueDate: 2026-02-07 (2 days from today if today is 2026-02-05)
- Status: "behind"

#### 2.10 Weekly Review Seeder
Seed for current week:
- AiSummary: "You showed up most days but avoided leverage tasks."
- Completed: false

### Phase 3: Seeder Execution

#### 3.1 Options for Running Seeder
1. **Command Line Tool** (Recommended)
   - Create `backend/src/POS.Tools/SeedDatabase` project
   - Console app that runs seeder
   - Command: `dotnet run --project backend/src/POS.Tools/SeedDatabase`

2. **API Endpoint** (Development Only)
   - Add `/api/admin/seed` endpoint
   - Only enabled in Development environment
   - Protected or documented for dev use

3. **Startup Hook** (Optional)
   - Auto-seed on first startup if database is empty
   - Check if user exists, if not, seed

#### 3.2 Recommended Approach
- **Primary**: Command line tool for explicit control
- **Secondary**: API endpoint for quick testing during development

### Phase 4: Cleanup

#### 4.1 Mobile App
- **Option A**: Delete `mobile/services/mockData.ts` (cleanest)
- **Option B**: Keep file but add comment: "DEPRECATED: Use database seed data instead"
- **Recommendation**: Keep with deprecation notice for reference

#### 4.2 Backend
- No cleanup needed - services already use database

### Phase 5: Testing

#### 5.1 Test Checklist
- [ ] Run seeder successfully
- [ ] Verify all collections have data
- [ ] Test GET /api/today returns seeded data
- [ ] Test GET /api/schedule returns seeded blocks
- [ ] Test GET /api/deadlines returns seeded deadline
- [ ] Test GET /api/money/summary returns seeded income
- [ ] Test GET /api/weekly-review returns seeded review
- [ ] Verify mobile app displays seeded data
- [ ] Test idempotency (run seeder twice, no duplicates)

## Implementation Details

### Data Mapping: Mock Data → Database

| Mock Data | Database Entity | Collection |
|-----------|----------------|------------|
| `mockTodayResponse.betterItems` | `BetterItem` | `betterItems` |
| `mockTodayResponse.tasks` | `Task` | `tasks` |
| `mockTodayResponse.discipline` | `DisciplineEntry` | `disciplineEntries` |
| `mockTodayResponse.diet` | `DietEntry` | `dietEntries` |
| `mockTodayResponse.currentBlock` | `ScheduleBlockInstance` | `scheduleBlockInstances` |
| `mockTodayResponse.deadlineWarning` | `Deadline` | `deadlines` |
| `mockScheduleResponse` | `ScheduleBlockInstance` | `scheduleBlockInstances` |
| `mockDeadlinesResponse` | `Deadline` | `deadlines` |
| `mockMoneySummaryResponse.income` | `IncomeEntry` | `incomeEntries` |
| `mockWeeklyReviewResponse` | `WeeklyReview` | `weeklyReviews` |

### Date Handling
- **Today's Date**: Use `DateTime.UtcNow.Date` for day-anchored entities
- **Relative Dates**: Calculate relative to today (e.g., deadline 2 days from now)
- **Historical Dates**: Use specific dates for income entries (e.g., 6 days ago)

### User ID
- Use `"default-user-id"` to match current authentication placeholder
- Seeder should accept userId parameter for flexibility

## File Structure

```
backend/
├── src/
│   ├── POS.Infrastructure/
│   │   └── Data/
│   │       └── Seeders/
│   │           ├── DataSeeder.cs
│   │           ├── UserSeeder.cs
│   │           ├── DaySeeder.cs
│   │           ├── BetterItemSeeder.cs
│   │           ├── TaskSeeder.cs
│   │           ├── ScheduleSeeder.cs
│   │           ├── DisciplineSeeder.cs
│   │           ├── DietSeeder.cs
│   │           ├── MoneySeeder.cs
│   │           ├── DeadlineSeeder.cs
│   │           └── WeeklyReviewSeeder.cs
│   └── POS.Tools/ (optional)
│       └── SeedDatabase/
│           └── Program.cs
└── DATABASE_MIGRATION_PLAN.md
```

## Success Criteria

✅ **Migration Complete When:**
1. Seeder can populate database with initial data
2. All API endpoints return seeded data (not empty)
3. Mobile app displays seeded data correctly
4. No hardcoded data remains in services
5. Mock data file is deprecated/removed
6. Seeder is idempotent and safe to run multiple times

## Next Steps

1. Create seeder infrastructure
2. Implement individual seeders
3. Create seeder execution mechanism
4. Test with real API calls
5. Clean up mock data
6. Document seeder usage
