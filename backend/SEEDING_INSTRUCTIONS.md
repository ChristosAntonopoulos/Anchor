# Database Seeding Instructions

## Overview

The database seeder populates the database with initial data matching the mock data that was previously hardcoded. All seeders are **idempotent** - running them multiple times is safe and won't create duplicates.

## Quick Start

### Automatic Seeding (Default Behavior)

**The database is automatically seeded on startup** when running in Development mode if the database is empty.

Simply start the backend:
```powershell
cd backend\src\POS.Api
dotnet run
```

The application will:
1. Check if the database has data (checks for Better Items, Tasks, or Schedule blocks for today)
2. If empty, automatically seed all initial data
3. Log the seeding process to the console

You'll see messages like:
```
[INFO] Database is empty. Auto-seeding initial data...
[INFO] Starting database seeding for user default-user-id
[INFO] Database auto-seeding completed successfully.
```

Or if data already exists:
```
[INFO] Database already contains data. Skipping auto-seed.
```

### Option 1: Manual Seeding via API Endpoint

1. **Start the backend:**
   ```powershell
   cd backend\src\POS.Api
   dotnet run
   ```

2. **Seed the database:**
   ```powershell
   # Using curl
   curl -X POST http://localhost:5000/api/seed

   # Or using PowerShell
   Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method POST
   ```

3. **Check if seeded:**
   ```powershell
   # Check seeding status
   curl http://localhost:5000/api/seed
   ```

### Option 2: From Swagger UI

1. Navigate to: `http://localhost:5000/swagger`
2. Find the `Seed` controller
3. Click on `POST /api/seed`
4. Click "Try it out" then "Execute"

## What Gets Seeded

The seeder creates the following data for the default user (`default-user-id`):

### User
- Default user with ID: `default-user-id`
- Timezone: UTC

### Day
- Today's Day entity

### Better Items (for today)
- "Finish deadline API endpoint" (work, not completed)
- "Send 5 outreach messages" (leverage, not completed)

### Tasks (for today)
- "Fix auth bug" (work, not completed)

### Schedule Blocks (for today)
- "Deep Work" (10:00 - 12:00)
- "Leverage" (13:00 - 14:30)
- "Health" (16:30 - 18:00)

### Discipline Entry (for today)
- Walk: true
- Diet: true
- Water: true
- Gym: false
- Cooked: false
- Meditation: false

### Diet Entry (for today)
- Compliant: true

### Income Entry
- Date: 6 days ago
- Source: "Client A"
- Amount: 420 USD

### Deadline
- Title: "Platform X"
- Due Date: 2 days from today
- Status: "behind"

### Weekly Review
- Current week
- AI Summary: "You showed up most days but avoided leverage tasks."
- Completed: false

## Seeder Behavior

### Idempotency
- All seeders check if data already exists before inserting
- Running the seeder multiple times is safe
- No duplicates will be created

### Date Handling
- Day-anchored entities (Better Items, Tasks, Schedule, Discipline, Diet) use **today's date**
- Income entry uses **6 days ago** (to match `daysSinceLastIncome: 6`)
- Deadline uses **2 days from today** (to match `daysLeft: 2`)
- Weekly Review uses **current week**

### User ID
- Default user ID: `"default-user-id"` (matches current auth placeholder)
- All seeded data belongs to this user

## API Endpoints

### POST /api/seed
Seeds the database with initial data.

**Response:**
```json
{
  "message": "Database seeded successfully",
  "seeded": true
}
```

**If already seeded:**
```json
{
  "message": "Database already seeded. Use DELETE to reset and reseed.",
  "seeded": true
}
```

### GET /api/seed
Checks if database has been seeded.

**Response:**
```json
{
  "seeded": true
}
```

### DELETE /api/seed
Resets and reseeds the database (currently just reseeds since seeders are idempotent).

**Response:**
```json
{
  "message": "Database reset and reseeded successfully",
  "seeded": true
}
```

## Environment Restrictions

⚠️ **Important**: The `/api/seed` endpoints are **only available in Development environment**.

In Production, these endpoints return 404.

## Testing After Seeding

After seeding, test these endpoints:

1. **Today's Data:**
   ```powershell
   curl http://localhost:5000/api/today
   ```

2. **Schedule:**
   ```powershell
   curl http://localhost:5000/api/schedule
   ```

3. **Deadlines:**
   ```powershell
   curl http://localhost:5000/api/deadlines
   ```

4. **Money Summary:**
   ```powershell
   curl http://localhost:5000/api/money/summary
   ```

5. **Weekly Review:**
   ```powershell
   curl http://localhost:5000/api/weekly-review
   ```

All endpoints should now return the seeded data instead of empty arrays/defaults.

## Troubleshooting

### "Database already seeded"
- This is normal if you've seeded before
- The seeder is idempotent, so it won't create duplicates
- If you want fresh data, you can manually delete collections in MongoDB

### "This endpoint is only available in Development environment"
- Make sure `ASPNETCORE_ENVIRONMENT=Development` is set
- Check `launchSettings.json` - it should have `ASPNETCORE_ENVIRONMENT: Development`

### Data not appearing
- Check MongoDB is running: `mongosh` or check connection string
- Verify seeding was successful: `GET /api/seed`
- Check logs for any errors during seeding
- Verify you're using the correct user ID (`default-user-id`)

## File Locations

- **Seeder Infrastructure**: `backend/src/POS.Infrastructure/Data/Seeders/`
- **Main Seeder**: `backend/src/POS.Infrastructure/Data/Seeders/DataSeeder.cs`
- **Seed Controller**: `backend/src/POS.Api/Controllers/SeedController.cs`
- **Migration Plan**: `backend/DATABASE_MIGRATION_PLAN.md`
