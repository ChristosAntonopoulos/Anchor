# AI & Scheduling Project Instructions

## Overview

This document provides comprehensive instructions for building a separate **AI & Scheduling Service** that will handle all AI processing, scheduled jobs, and data refinement for the Personal Operating System (POS).

The **Data API** (this backend) handles only CRUD operations. The **AI & Scheduling Service** (separate project) handles all intelligence, analysis, and automated data generation.

---

## 1. Project Responsibilities

The AI & Scheduling Service is responsible for:

- **AI Prompt Execution**: Execute all AI prompts using OpenAI/Anthropic APIs
- **Response Parsing**: Parse AI JSON responses and validate structure
- **Scheduled Job Execution**: Run daily and weekly jobs at specified times
- **Data Refinement**: Enrich and refine data based on AI analysis
- **Notification Triggering**: Determine when to send notifications and trigger them
- **AI Job Audit Logging**: Write execution logs to `AIJobRun` collection
- **Data Aggregation**: Gather data from multiple collections for AI analysis

---

## 2. Data Access Contract

### 2.1 MongoDB Connection

The AI service connects to the **same MongoDB database** as the Data API:
- **Connection String**: Configured via environment variable `MongoDb:ConnectionString`
- **Database Name**: `pos` (or as configured)
- **Collections**: Direct access to all collections

### 2.2 Read Operations

The AI service needs to **READ** from these collections:

#### Core Collections
- `users` - User information
- `days` - Day entities (for date tracking)
- `aiJobRuns` - Previous AI job execution logs (for deduplication)

#### Feature Collections
- `deadlines` - Active deadlines (for Better Today generation and deadline checks)
- `betterItems` - Better items (for completion tracking)
- `tasks` - Tasks (for completion tracking)
- `disciplineEntries` - Daily discipline/habit data (for analysis)
- `dietEntries` - Daily diet compliance (for pattern analysis)
- `incomeEntries` - Income events (for money momentum)
- `scheduleBlockInstances` - Schedule blocks (for pattern analysis)
- `scheduleBlockHistories` - Historical schedule data (for optimization)
- `weeklyReviews` - Weekly review data (for summary generation)

### 2.3 Write Operations

The AI service needs to **WRITE** to these collections:

#### Generated Data
- `betterItems` - Create new Better Items (source: "ai")
- `tasks` - Create suggested tasks (source: "ai", optional)
- `habitInsights` - Create weekly habit insights
- `moneyInsights` - Create weekly money trend insights
- `weeklyReviews` - Update `aiSummary` field

#### Updated Data
- `deadlines` - Update `status` field (on track/behind)
- `scheduleBlockDefinitions` - Update suggested durations (optional)

#### Audit Logs
- `aiJobRuns` - Log every AI job execution with:
  - `jobType` - Type of job (e.g., "better-today-generation", "deadline-check")
  - `forDate` - Date the job is for
  - `startedAt` - Job start time
  - `finishedAt` - Job completion time
  - `status` - Success/Failed
  - `model` - AI model used
  - `promptVersion` - Version of prompt template
  - `inputSummary` - Summary of input data
  - `output` - AI response
  - `error` - Error message if failed

### 2.4 API Endpoints (Optional)

The AI service can optionally call Data API endpoints if needed:
- `GET /api/today` - Get today's aggregated data
- `GET /api/deadlines` - Get all deadlines
- `GET /api/schedule` - Get schedule blocks

**Note**: Direct MongoDB access is preferred for performance.

---

## 3. Scheduled Jobs Specification

### 3.1 Daily Jobs

#### Job 1: Better Today Generation
- **Schedule**: Every day at 08:00 UTC
- **Cron**: `0 8 * * *`
- **Job Type**: `better-today-generation`

**Read Operations**:
1. Get active deadlines (not completed, due date >= today)
2. Get yesterday's completion data:
   - Count completed Better Items
   - Count completed Tasks
   - Calculate discipline score (0-6 from DisciplineEntry)
3. Get last 7 days data:
   - Count leverage days (Better Items with category "leverage")
   - Calculate health consistency % (DisciplineEntry compliance)

**AI Prompt**: Use **PROMPT 1** (see section 4.1)

**Write Operations**:
1. Create 1-3 new `BetterItem` entities:
   - `userId` - From job context
   - `date` - Today's date
   - `title` - From AI response items array
   - `category` - From AI response focusCategory
   - `completed` - false
   - `source` - "ai"
2. Create `AIJobRun` entry with execution details

**Notification**: Trigger "Here's what makes you better today" at 08:30

**Deduplication**: Check if job already ran today for this user (check `aiJobRuns`)

---

#### Job 2: Deadline Alignment Check
- **Schedule**: Every day at 09:00 UTC (per active deadline)
- **Cron**: `0 9 * * *`
- **Job Type**: `deadline-alignment-check`

**Read Operations** (per active deadline):
1. Get deadline details (title, dueDate, importance)
2. Calculate days left: `(dueDate - today).Days`
3. Get recent output (last 3 days):
   - Count completed Better Items
   - Count completed Tasks

**AI Prompt**: Use **PROMPT 2** (see section 4.2)

**Write Operations**:
1. Update `Deadline.Status`:
   - If AI returns "behind" → set to `DeadlineStatus.Behind`
   - If AI returns "on track" → set to `DeadlineStatus.OnTrack`
2. Create `AIJobRun` entry

**Notification**: 
- If status = "behind" → Trigger immediately: "You're behind on {{deadline}}. Adjust today."
- If 3 days before due → Trigger: "{{deadline}} is due soon. Stay sharp."

---

#### Job 3: Task Suggestions (Optional)
- **Schedule**: Every day at 09:30 UTC
- **Cron**: `0 9,30 * * *`
- **Job Type**: `task-suggestions`
- **Condition**: Only if user has < 3 tasks today

**Read Operations**:
1. Get today's Better Items
2. Get active deadlines

**AI Prompt**: Custom prompt asking "What concrete task would move today's focus forward?"

**Write Operations**:
1. Create 1-2 suggested `Task` entities (source: "ai")
2. Create `AIJobRun` entry

**Notification**: None (optional feature)

---

### 3.2 Weekly Jobs

#### Job 4: Habit Analysis
- **Schedule**: Every Monday at 09:00 UTC
- **Cron**: `0 9 * * 1`
- **Job Type**: `habit-analysis`

**Read Operations**:
1. Get last 7 days `DisciplineEntry` data
2. Calculate consistency per habit (gym, walk, cooked, diet, meditation, water)

**AI Prompt**: Use **PROMPT 3** (see section 4.3)

**Write Operations**:
1. Create or update `HabitInsight` entity:
   - `userId` - From job context
   - `weekId` - Current week in YYYY-WW format
   - `weakestHabit` - From AI response
   - `suggestion` - From AI response
2. Create `AIJobRun` entry

**Notification**: Weekly insight notification (timing TBD)

---

#### Job 5: Money Momentum Summary
- **Schedule**: Every Monday at 10:00 UTC
- **Cron**: `0 10 * * 1`
- **Job Type**: `money-momentum-summary`

**Read Operations**:
1. Get last 7 days `IncomeEntry` data
2. Count leverage days (Better Items with category "leverage" in last 7 days)

**AI Prompt**: Use **PROMPT 4** (see section 4.4)

**Write Operations**:
1. Create or update `MoneyInsight` entity:
   - `userId` - From job context
   - `weekId` - Current week in YYYY-WW format
   - `trend` - From AI response (Up/Flat/Down)
   - `message` - From AI response
2. Create `AIJobRun` entry

**Notification**: Weekly summary notification (timing TBD)

---

#### Job 6: Diet Pattern Analysis (Optional)
- **Schedule**: Every Monday at 10:30 UTC
- **Cron**: `0 10,30 * * 1`
- **Job Type**: `diet-pattern-analysis`

**Read Operations**:
1. Get last 7 days `DietEntry` data
2. Analyze compliance patterns (e.g., weekends fail more)

**AI Prompt**: Custom prompt asking "Do you see any pattern in my diet compliance?"

**Write Operations**:
1. Store pattern insights (format TBD)
2. Create `AIJobRun` entry

**Notification**: Optional weekly insight

---

#### Job 7: Schedule Block Optimization (Optional)
- **Schedule**: Every Monday at 11:00 UTC
- **Cron**: `0 11 * * 1`
- **Job Type**: `schedule-optimization`

**Read Operations**:
1. Get last 7 days `ScheduleBlockHistory` data
2. Analyze energy patterns and block usage

**AI Prompt**: Custom prompt asking "Based on my energy and consistency, how should my day be structured?"

**Write Operations**:
1. Update `ScheduleBlockDefinition` suggestions (optional)
2. Create `AIJobRun` entry

**Notification**: None (background optimization)

---

#### Job 8: Weekly Review Summary
- **Schedule**: Every Sunday at 20:00 UTC
- **Cron**: `0 20 * * 0`
- **Job Type**: `weekly-review-summary`

**Read Operations**:
1. Get week's completion data:
   - Count completed Better Items
   - Count completed Tasks
   - Count missed days (days with no activity)
   - Calculate discipline consistency %
2. Get current week's `WeeklyReview` entity (or create if doesn't exist)

**AI Prompt**: Use **PROMPT 5** (see section 4.5)

**Write Operations**:
1. Update `WeeklyReview.AiSummary` field with AI-generated summary
2. Create `AIJobRun` entry

**Notification**: Sunday 18:00 reminder if review not completed

---

## 4. AI Prompt Templates

All prompts must return **JSON only**. No markdown, no explanations.

### 4.1 PROMPT 1: Daily "Better Today" Generation

**When**: Every morning (08:00)

**System Prompt**:
```
You are a strict personal operating system.
You suggest concrete, observable actions.
No motivation, no philosophy, no explanations.
```

**User Prompt Template**:
```
Date: {{date}}

Active deadlines:
{{#each deadlines}}
- {{title}} ({{daysLeft}} days left)
{{/each}}

Yesterday:
- Better items completed: {{yesterday.betterCompleted}}
- Tasks completed: {{yesterday.tasksCompleted}}
- Discipline score (0–6): {{yesterday.disciplineScore}}

Last 7 days:
- Leverage days: {{last7.leverageDays}}
- Health consistency (%): {{last7.healthConsistency}}

Task:
Propose 1–3 concrete actions for today that would clearly make me better.
Rules:
- Actions must be observable and finishable today
- Prefer deadlines first, then leverage, then health
- Max 8 words per action

Return JSON only.
```

**Expected Output**:
```json
{
  "focusCategory": "work",
  "items": [
    "Finish deadline API endpoint",
    "Send 5 outreach messages",
    "Train legs"
  ]
}
```

**Validation**:
- `focusCategory` must be one of: "work", "leverage", "health", "stability"
- `items` must be array of 1-3 strings
- Each item must be max 8 words

---

### 4.2 PROMPT 2: Deadline Alignment Check

**When**: Daily per active deadline (09:00)

**System Prompt**:
```
You evaluate progress honestly.
No encouragement. No fear tactics.
```

**User Prompt Template**:
```
Deadline: {{title}}
Due in: {{daysLeft}} days

Recent output (last 3 days):
- Better items completed: {{recent.better}}
- Tasks completed: {{recent.tasks}}

Question:
Is the current pace enough to meet the deadline?

Return JSON only.
```

**Expected Output**:
```json
{
  "status": "behind",
  "message": "Current output is not enough. Increase daily progress."
}
```

**Validation**:
- `status` must be "on track" or "behind"
- `message` must be a string

---

### 4.3 PROMPT 3: Weekly Habit Analysis

**When**: Weekly (Monday 09:00)

**System Prompt**:
```
You analyze consistency patterns.
Be factual. Be brief.
```

**User Prompt Template**:
```
Last 7 days discipline data:
{{disciplineSummary}}

Question:
Which habit is weakest and what is one simple correction?

Return JSON only.
```

**Expected Output**:
```json
{
  "weakestHabit": "meditation",
  "suggestion": "Reduce to 5 minutes after dinner."
}
```

**Validation**:
- `weakestHabit` must be one of: "gym", "walk", "cooked", "diet", "meditation", "water"
- `suggestion` must be a string

---

### 4.4 PROMPT 4: Money Momentum Summary

**When**: Weekly (Monday 10:00)

**System Prompt**:
```
You summarize trends without judgment.
```

**User Prompt Template**:
```
Income events:
{{incomeSummary}}

Leverage days this week: {{leverageDays}}

Question:
Is momentum building, flat, or declining?

Return JSON only.
```

**Expected Output**:
```json
{
  "trend": "flat",
  "message": "No income and low leverage activity this week."
}
```

**Validation**:
- `trend` must be one of: "up", "flat", "down"
- `message` must be a string

---

### 4.5 PROMPT 5: Weekly Review Summary

**When**: Weekly (Sunday 20:00)

**System Prompt**:
```
You provide an honest weekly summary.
No sugarcoating. No shaming.
```

**User Prompt Template**:
```
Completed better items: {{completedBetter}}
Completed tasks: {{completedTasks}}
Missed days: {{missedDays}}
Discipline consistency (%): {{disciplineConsistency}}

Task:
Summarize the week in 3 short sentences and suggest one adjustment.

Return JSON only.
```

**Expected Output**:
```json
{
  "summary": "You showed up most days but avoided leverage tasks.",
  "adjustment": "Schedule leverage work earlier in the day."
}
```

**Validation**:
- `summary` must be a string (3 sentences max)
- `adjustment` must be a string

---

## 5. Notification Rules

### 5.1 Global Rules
- **Max 3 notifications per day** per user
- **No notifications after 21:00** (9 PM)
- **Tone**: Calm, direct, non-judgmental
- **No emojis**
- **No motivational language**

### 5.2 Notification Triggers

#### Home / Today
- **08:30** - "Here's what makes you better today." (Trigger: Daily AI focus generated)
- **14:00** - "Pick one thing and finish it." (Trigger: No BetterItem completed)
- **19:30** - "One small win is still a win." (Trigger: All BetterItems incomplete)

#### Tasks
- **11:00** - "Add one task before the day runs you." (Trigger: No tasks created)

#### Discipline / Habits
- **20:00** - "Quick check: did you take care of yourself today?" (Trigger: Any habit unchecked)
- **Weekly** - Habit insight notification (timing TBD)

#### Diet
- **19:00** - "Did you eat according to plan today?" (Trigger: Diet not logged)

#### Deadlines
- **Immediate** - "You're behind on {{deadline}}. Adjust today." (Trigger: Deadline status = behind)
- **3 days before due** - "{{deadline}} is due soon. Stay sharp."

#### Weekly Review
- **Sunday 18:00** - "Weekly review needed to reset the system." (Trigger: Review not completed)

### 5.3 Notification Service Integration

The notification service integration is **TBD**. The AI service should:
1. Determine if notification should be sent (check rules, timing, user preferences)
2. Call notification service API (endpoint TBD)
3. Log notification trigger in `AIJobRun` if needed

---

## 6. Data Models Reference

### 6.1 Entities to Read

#### BetterItem
```csharp
public class BetterItem : DayAnchoredEntity
{
    public string Title { get; set; }
    public string Category { get; set; } // work|leverage|health|stability
    public bool Completed { get; set; }
    public string Source { get; set; } // ai|user
    // Inherited: UserId, Date, Id, CreatedAt, UpdatedAt
}
```

#### Deadline
```csharp
public class Deadline : EntityBase
{
    public string Title { get; set; }
    public DateTime DueDate { get; set; }
    public int Importance { get; set; } // 1-5
    public DeadlineStatus Status { get; set; } // OnTrack|Behind|Completed
    // Inherited: UserId, Id, CreatedAt, UpdatedAt
}
```

#### Task
```csharp
public class Task : DayAnchoredEntity
{
    public string Title { get; set; }
    public string Category { get; set; }
    public bool Completed { get; set; }
    public string Source { get; set; } // ai|user
    // Inherited: UserId, Date, Id, CreatedAt, UpdatedAt
}
```

#### DisciplineEntry
```csharp
public class DisciplineEntry : DayAnchoredEntity
{
    public bool Gym { get; set; }
    public bool Walk { get; set; }
    public bool Cooked { get; set; }
    public bool Diet { get; set; }
    public bool Meditation { get; set; }
    public bool Water { get; set; }
    // Inherited: UserId, Date, Id, CreatedAt, UpdatedAt
}
```

#### DietEntry
```csharp
public class DietEntry : DayAnchoredEntity
{
    public bool Compliant { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Note { get; set; }
    // Inherited: UserId, Date, Id, CreatedAt, UpdatedAt
}
```

#### IncomeEntry
```csharp
public class IncomeEntry : DayAnchoredEntity
{
    public string Source { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } // USD, EUR, etc.
    // Inherited: UserId, Date, Id, CreatedAt, UpdatedAt
}
```

#### ScheduleBlockInstance
```csharp
public class ScheduleBlockInstance : DayAnchoredEntity
{
    public string Title { get; set; }
    public string StartTime { get; set; } // HH:mm format
    public string EndTime { get; set; } // HH:mm format
    // Inherited: UserId, Date, Id, CreatedAt, UpdatedAt
}
```

#### WeeklyReview
```csharp
public class WeeklyReview : EntityBase
{
    public string WeekId { get; set; } // YYYY-WW format
    public string AiSummary { get; set; }
    public string? Shipped { get; set; }
    public string? Improved { get; set; }
    public string? Avoided { get; set; }
    public string? NextFocus { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    // Inherited: UserId, Id, CreatedAt, UpdatedAt
}
```

### 6.2 Entities to Write

#### BetterItem (Create)
- Set `source` = "ai"
- Set `completed` = false
- Set `category` from AI response
- Set `title` from AI response items array

#### HabitInsight (Create/Update)
```csharp
public class HabitInsight : EntityBase
{
    public string WeekId { get; set; } // YYYY-WW format
    public string WeakestHabit { get; set; }
    public string Suggestion { get; set; }
    // Inherited: UserId, Id, CreatedAt, UpdatedAt
}
```

#### MoneyInsight (Create/Update)
```csharp
public class MoneyInsight : EntityBase
{
    public string WeekId { get; set; } // YYYY-WW format
    public MoneyTrend Trend { get; set; } // Up|Flat|Down
    public string Message { get; set; }
    // Inherited: UserId, Id, CreatedAt, UpdatedAt
}
```

#### AIJobRun (Create - Audit Log)
```csharp
public class AIJobRun : EntityBase
{
    public string JobType { get; set; }
    public DateTime? ForDate { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public JobStatus Status { get; set; } // Pending|Running|Success|Failed
    public string Model { get; set; }
    public string PromptVersion { get; set; }
    public Dictionary<string, object> InputSummary { get; set; }
    public Dictionary<string, object> Output { get; set; }
    public string? Error { get; set; }
    // Inherited: UserId, Id, CreatedAt, UpdatedAt
}
```

---

## 7. Error Handling

### 7.1 AI Job Failures

**When AI call fails**:
1. Log error in `AIJobRun.Error` field
2. Set `AIJobRun.Status` = `Failed`
3. Set `AIJobRun.FinishedAt` = current time
4. **Do NOT** create/update target entities
5. Log error to application logs

**Retry Strategy**:
- Retry failed jobs once after 1 hour
- If still fails, skip for that day/week
- Log retry attempts in `AIJobRun`

### 7.2 Invalid AI Responses

**When AI returns invalid JSON**:
1. Log raw response in `AIJobRun.Output`
2. Set status = `Failed`
3. Log error: "Invalid JSON response from AI"
4. Do NOT create/update entities

**When AI returns missing required fields**:
1. Log partial response in `AIJobRun.Output`
2. Set status = `Failed`
3. Log error: "Missing required fields: {{fields}}"
4. Do NOT create/update entities

### 7.3 Database Errors

**When MongoDB write fails**:
1. Log error in `AIJobRun.Error`
2. Set status = `Failed`
3. Retry write operation once
4. If still fails, log and skip

### 7.4 Fallback Behaviors

**Better Today Generation fails**:
- User can manually create Better Items
- No fallback AI suggestions

**Deadline Check fails**:
- Deadline status remains unchanged
- User can manually update status

**Weekly jobs fail**:
- Insights remain empty
- User can proceed without insights

---

## 8. Configuration Requirements

### 8.1 Environment Variables

```bash
# MongoDB
MongoDb__ConnectionString=mongodb://localhost:27017
MongoDb__DatabaseName=pos

# OpenAI
OpenAI__ApiKey=sk-...
OpenAI__Model=gpt-4o-mini  # or gpt-4, gpt-3.5-turbo
OpenAI__MaxTokens=500

# Job Scheduling
Jobs__BetterTodayGeneration__Cron=0 8 * * *
Jobs__DeadlineCheck__Cron=0 9 * * *
Jobs__TaskSuggestions__Cron=0 9,30 * * *
Jobs__HabitAnalysis__Cron=0 9 * * 1
Jobs__MoneyMomentum__Cron=0 10 * * 1
Jobs__DietAnalysis__Cron=0 10,30 * * 1
Jobs__ScheduleOptimization__Cron=0 11 * * 1
Jobs__WeeklyReview__Cron=0 20 * * 0

# Notification Service (TBD)
Notifications__ServiceUrl=https://...
Notifications__ApiKey=...

# Application
Logging__Level=Information
```

### 8.2 Prompt Versioning

**Current Prompt Versions**:
- `better-today-v1` - PROMPT 1
- `deadline-check-v1` - PROMPT 2
- `habit-analysis-v1` - PROMPT 3
- `money-momentum-v1` - PROMPT 4
- `weekly-review-v1` - PROMPT 5

Store version in `AIJobRun.PromptVersion` for audit trail.

### 8.3 Timezone Handling

- All scheduled jobs run in **UTC**
- All dates stored in **UTC**
- User timezone conversion handled by frontend/Data API

---

## 9. Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Set up project structure
- [ ] Configure MongoDB connection
- [ ] Configure OpenAI client
- [ ] Set up job scheduler (Quartz.NET, Hangfire, or similar)
- [ ] Implement `AIJobRun` logging

### Phase 2: Daily Jobs
- [ ] Implement Better Today Generation job
- [ ] Implement Deadline Alignment Check job
- [ ] Implement Task Suggestions job (optional)
- [ ] Test with sample data

### Phase 3: Weekly Jobs
- [ ] Implement Habit Analysis job
- [ ] Implement Money Momentum Summary job
- [ ] Implement Diet Pattern Analysis job (optional)
- [ ] Implement Schedule Optimization job (optional)
- [ ] Implement Weekly Review Summary job

### Phase 4: Notifications
- [ ] Integrate notification service
- [ ] Implement notification trigger logic
- [ ] Test notification rules

### Phase 5: Production
- [ ] Add comprehensive error handling
- [ ] Add monitoring and alerting
- [ ] Add retry logic
- [ ] Performance testing
- [ ] Deploy to production

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Test prompt template rendering
- Test JSON response parsing
- Test data aggregation logic
- Test notification trigger logic

### 10.2 Integration Tests
- Test MongoDB read/write operations
- Test OpenAI API calls (with mock)
- Test job scheduler execution
- Test end-to-end job flows

### 10.3 Manual Testing
- Run jobs manually with test user data
- Verify AI responses are valid
- Verify entities are created correctly
- Verify notifications are triggered

---

## 11. Monitoring & Observability

### 11.1 Metrics to Track
- Job execution success rate
- AI API response time
- AI API cost per job
- Database query performance
- Notification delivery rate

### 11.2 Logging
- Log all job starts/completions
- Log all AI API calls (request/response)
- Log all database operations
- Log all errors with full context

### 11.3 Alerts
- Alert on job failure rate > 10%
- Alert on AI API errors
- Alert on database connection failures
- Alert on notification service failures

---

## 12. Notes

- This service should be **stateless** - all state in MongoDB
- Jobs should be **idempotent** - safe to retry
- Always log to `AIJobRun` for audit trail
- Keep prompts **versioned** for easy rollback
- Test with real AI responses before production
- Monitor AI costs closely

---

## Questions?

For questions about data models, refer to:
- `backend/src/POS.Core/Entities/` - All entity definitions
- `personal_operating_system_mvp_specification.md` - Full specification

For questions about API contracts, refer to:
- `backend/src/POS.Api/Controllers/` - API endpoint definitions
- `backend/src/POS.Application/DTOs/` - DTO definitions
