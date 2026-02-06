# Personal Operating System (POS) – MVP v2 (Features, Pages, AI, Notifications)

## Purpose
A **personal operating system** that runs daily with minimal thinking.
The system answers automatically:
1. What makes me better today?
2. What must I not ignore?
3. Am I progressing in the right direction?

The app **proactively generates structure** using AI and **nudges execution** using notifications.

---

## Core Design Principles
- **Pages over features** (each page has a single responsibility)
- **AI proposes, user confirms** (never the opposite)
- **Binary > vague** (done / not done)
- **Few updates, high signal**
- **Notifications as guidance, not noise**

---

## GLOBAL AI ROLE (IMPORTANT)
AI is NOT a chat companion.
AI is a **background planner and analyzer**.

AI responsibilities:
- Generate daily suggestions
- Detect avoidance patterns
- Propose priorities
- Summarize weekly progress

User responsibilities:
- Confirm / reject
- Execute

---

# PAGE & FEATURE BREAKDOWN

---

## 1. HOME / TODAY PAGE (CORE PAGE)

### What it does
Central execution dashboard for the day.

### What is shown
- **What Makes Me Better Today** (max 3 items)
- Current schedule block
- Discipline checklist (compact)
- Deadline warning (only if needed)

---

### AI-generated data
**Generated once per day (morning)**

AI proposes:
- 1–3 “Better Today” items
- Suggested focus category (Work / Leverage / Health / Stability)

### What AI is asked
"Based on my active projects, deadlines, habits, and recent behavior, what 1–3 concrete actions today would make me better?"

### Data required by AI
- Active projects
- Deadlines
- Yesterday’s completion data
- Habit consistency (last 7 days)

---

### User interaction
- Accept / edit / reject suggestions
- Mark items complete

---

### Notifications
- Morning: "Here’s what makes you better today"
- Midday (if nothing done): "Pick one thing and finish it"
- Evening (if incomplete): "One small win still counts"

---

### Update frequency
- AI: once daily
- User updates: real-time

---

## 2. TASKS PAGE (TODAY-ONLY EXECUTION)

### What it does
Holds concrete execution tasks for the day.

### What is shown
- Today’s tasks (max 5)
- Category tag per task

---

### AI-generated data
Optional daily suggestion:
- 1–2 tasks derived from deadlines or Better items

### What AI is asked
"What concrete task would move today’s focus forward?"

---

### Notifications
- If no tasks by 11:00 → "Add one task before the day runs you"
- If tasks untouched → soft nudge in afternoon

---

### Update frequency
- AI: once daily (optional)
- User: manual

---

## 3. SCHEDULE PAGE (TIME BLOCKS)

### What it does
Provides daily rhythm without micromanagement.

### What is shown
- Fixed daily blocks
- Current block highlighted

---

### AI-generated data
**Generated once, adjusted weekly**

AI proposes:
- Block durations based on usage patterns

### What AI is asked
"Based on my energy and consistency, how should my day be structured?"

---

### Notifications
- Block start: subtle reminder
- Long inactivity during work block → nudge

---

### Update frequency
- AI: weekly
- User: manual edits only outside the day

---

## 4. DISCIPLINE / HABITS PAGE

### What it does
Tracks consistency and self-trust.

### What is shown
- Daily habit checklist
- Optional note per day

---

### AI-generated data
AI analyzes (weekly):
- Habit consistency
- Weakest habit

### What AI is asked
"Which habit is currently weakest and needs attention?"

---

### Notifications
- Evening reminder if incomplete
- Weekly insight notification

---

### Update frequency
- AI: weekly
- User: daily

---

## 5. DIET PAGE

### What it does
Ensures dietary compliance without obsession.

### What is shown
- Daily compliance toggle
- Meal photo / short note

---

### AI-generated data
Optional weekly insight:
- Patterns (e.g. weekends fail more)

### What AI is asked
"Do you see any pattern in my diet compliance?"

---

### Notifications
- Evening reminder: "Did you eat according to plan today?"

---

### Update frequency
- AI: weekly
- User: daily

---

## 6. MONEY JOURNAL PAGE (QUIET)

### What it does
Tracks real-world results without daily pressure.

### What is shown
- Income log
- Weekly / monthly totals
- Days since last income

---

### AI-generated data
Weekly summary:
- Trend direction
- Gaps in leverage actions

### What AI is asked
"Based on my activity, am I creating future income momentum?"

---

### Notifications
- Weekly summary only
- No daily money notifications

---

### Update frequency
- AI: weekly
- User: manual on income events

---

## 7. DEADLINES PAGE

### What it does
Prevents time blindness.

### What is shown
- Active deadlines
- Days remaining
- Status (on track / behind)

---

### AI-generated data
Daily check:
- Is progress aligned with time left?

### What AI is asked
"Am I on track with this deadline based on recent output?"

---

### Notifications
- Warning when behind
- Reminder 3 days before due

---

### Update frequency
- AI: daily
- User: manual updates

---

## 8. WEEKLY REVIEW PAGE (LOCKED)

### What it does
Forces reflection and course correction.

### What is shown
- AI-generated weekly summary
- 4 short questions

---

### AI-generated data
Weekly summary:
- What shipped
- Consistency score
- Avoidance signals

### What AI is asked
"Summarize my week honestly. What worked, what didn’t, what should change?"

---

### Notifications
- Mandatory weekly prompt

---

### Update frequency
- AI: weekly
- User: weekly

---

## GLOBAL NOTIFICATION RULES

- Max 3 notifications/day
- No notifications after 21:00
- Tone: calm, direct, non-judgmental

---

## AI UPDATE FREQUENCY SUMMARY

- Daily: Today focus, deadline checks
- Weekly: Habits, diet, money, schedule, review
- Never real-time AI spam

---

## DATABASE & AI DATA ARCHITECTURE (MVP)

(unchanged – see previous section)

---

## AI PROMPT TEMPLATES (COPY–PASTE READY)

All prompts are **system-controlled**, deterministic, short, and action-oriented.
Tone: calm, honest, non-motivational.

---

## PROMPT 1: DAILY "BETTER TODAY" GENERATION

**When:** Every morning (once)

**SYSTEM PROMPT**
```
You are a strict personal operating system.
You suggest concrete, observable actions.
No motivation, no philosophy, no explanations.
```

**USER PROMPT**
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

**EXPECTED OUTPUT**
```
{
  "focusCategory": "work",
  "items": [
    "Finish deadline API endpoint",
    "Send 5 outreach messages",
    "Train legs"
  ]
}
```

---

## PROMPT 2: DEADLINE ALIGNMENT CHECK

**When:** Daily per active deadline

**SYSTEM PROMPT**
```
You evaluate progress honestly.
No encouragement. No fear tactics.
```

**USER PROMPT**
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

**EXPECTED OUTPUT**
```
{
  "status": "behind",
  "message": "Current output is not enough. Increase daily progress." 
}
```

---

## PROMPT 3: WEEKLY HABIT ANALYSIS

**When:** Weekly

**SYSTEM PROMPT**
```
You analyze consistency patterns.
Be factual. Be brief.
```

**USER PROMPT**
```
Last 7 days discipline data:
{{disciplineSummary}}

Question:
Which habit is weakest and what is one simple correction?

Return JSON only.
```

**EXPECTED OUTPUT**
```
{
  "weakestHabit": "meditation",
  "suggestion": "Reduce to 5 minutes after dinner." 
}
```

---

## PROMPT 4: MONEY MOMENTUM SUMMARY

**When:** Weekly

**SYSTEM PROMPT**
```
You summarize trends without judgment.
```

**USER PROMPT**
```
Income events:
{{incomeSummary}}

Leverage days this week: {{leverageDays}}

Question:
Is momentum building, flat, or declining?

Return JSON only.
```

**EXPECTED OUTPUT**
```
{
  "trend": "flat",
  "message": "No income and low leverage activity this week." 
}
```

---

## PROMPT 5: WEEKLY REVIEW SUMMARY

**When:** Weekly (before review unlocks)

**SYSTEM PROMPT**
```
You provide an honest weekly summary.
No sugarcoating. No shaming.
```

**USER PROMPT**
```
Completed better items: {{completedBetter}}
Completed tasks: {{completedTasks}}
Missed days: {{missedDays}}
Discipline consistency (%): {{disciplineConsistency}}

Task:
Summarize the week in 3 short sentences and suggest one adjustment.

Return JSON only.
```

**EXPECTED OUTPUT**
```
{
  "summary": "You showed up most days but avoided leverage tasks.",
  "adjustment": "Schedule leverage work earlier in the day." 
}
```

---

# NOTIFICATION COPY & TIMING RULES

Notifications are **scarce, calm, and contextual**.

---

## GLOBAL RULES
- Max 3 notifications per day
- None after 21:00
- No emojis
- No motivational language

---

## HOME / TODAY

**08:30 – Morning**
Trigger: Daily AI focus generated
Copy:
"Here’s what makes you better today."

**14:00 – Midday**
Trigger: No BetterItem completed
Copy:
"Pick one thing and finish it."

**19:30 – Evening**
Trigger: All BetterItems incomplete
Copy:
"One small win is still a win."

---

## TASKS

**11:00**
Trigger: No tasks created
Copy:
"Add one task before the day runs you."

---

## DISCIPLINE / HABITS

**20:00**
Trigger: Any habit unchecked
Copy:
"Quick check: did you take care of yourself today?"

---

## DIET

**19:00**
Trigger: Diet not logged
Copy:
"Did you eat according to plan today?"

---

## DEADLINES

**Immediate**
Trigger: Deadline status = behind
Copy:
"You’re behind on {{deadline}}. Adjust today."

**3 days before due**
Copy:
"{{deadline}} is due soon. Stay sharp."

---

## WEEKLY REVIEW

**Sunday 18:00**
Trigger: Review not completed
Copy:
"Weekly review needed to reset the system."

---

## FINAL NOTIFICATION RULE

If a notification does not clearly point to an action,
it is removed.


---

## FRONTEND SCREENS → DATA MAPPING & UX SPECIFICATION

This section defines **exactly what each screen shows**, **which data it reads/writes**, and **how it should feel to use**.

---

## GLOBAL FRONTEND PRINCIPLES
- Home is the default entry point
- One main action per screen
- Max 2 taps for any daily action
- Calm, minimal, whitespace-first UI
- Bottom navigation (max 5 tabs)

---

## NAVIGATION STRUCTURE

Bottom Tabs:
- Home
- Tasks
- Schedule
- Discipline
- More

More contains:
- Money
- Deadlines
- Weekly Review
- Settings

---

## 1. HOME / TODAY

### User intent
"Tell me what matters today."

### Layout (top → bottom)
- Date + subtle status indicator
- What Makes Me Better Today (hero section)
- Current schedule block
- Discipline quick toggles
- Deadline warning (conditional)

### UI Elements
- 1–3 large action cards (BetterItems)
- Checkbox interaction (tap to complete)
- Category color dot (very subtle)

### Reads
- Day
- BetterItem[]
- ScheduleBlock (current)
- DisciplineEntry (today)
- Deadline (if behind)

### Writes
- BetterItem.completed
- DisciplineEntry fields

---

## 2. TASKS (TODAY ONLY)

### User intent
"What do I actually need to do today?"

### Layout
- Simple vertical list
- Max 5 tasks

### UI Elements
- Checkbox list
- Add task button (disabled at limit)

### Reads
- Task[] (today)

### Writes
- Task.create
- Task.completed

---

## 3. SCHEDULE

### User intent
"What phase of the day am I in?"

### Layout
- Vertical block list (not time grid)
- Current block highlighted

### UI Rules
- Read-only during the day
- Editable only for future days

### Reads
- ScheduleBlock[]

### Writes
- None (MVP)

---

## 4. DISCIPLINE / DIET (COMBINED)

### User intent
"Did I take care of myself today?"

### Layout
- Today card with habit toggles
- Optional note / meal photo

### UI Elements
- Icon-based toggles
- Minimal text

### Reads
- DisciplineEntry (today)
- DietEntry (today)

### Writes
- DisciplineEntry updates
- DietEntry updates

---

## 5. MONEY (QUIET SCREEN)

### User intent
"Am I moving forward overall?"

### Layout
- Monthly total
- Days since last income
- Log income button

### UI Rules
- No charts in MVP
- Calm, low-pressure presentation

### Reads
- IncomeEntry[]

### Writes
- IncomeEntry.create

---

## 6. DEADLINES

### User intent
"What cannot slip?"

### Layout
- List of active deadlines
- Visual urgency indicator

### Reads
- Deadline[]

### Writes
- None (status set by system/AI)

---

## 7. WEEKLY REVIEW (LOCKED)

### User intent
"Reset and realign the system."

### Layout
- AI-generated summary (read-only)
- 4 short input fields
- Submit button

### UI Rules
- Cannot skip
- Must complete to unlock next week

### Reads
- WeeklyReview.aiSummary

### Writes
- WeeklyReview.submit

---

## FRONTEND DATA FLOW SUMMARY

| Screen | Reads | Writes |
|------|------|------|
| Home | Day, BetterItem, Discipline, Deadline | BetterItem, Discipline |
| Tasks | Task | Task |
| Schedule | ScheduleBlock | None |
| Discipline | DisciplineEntry, DietEntry | DisciplineEntry, DietEntry |
| Money | IncomeEntry | IncomeEntry |
| Deadlines | Deadline | None |
| Weekly Review | WeeklyReview | WeeklyReview |

---

## VISUAL STYLE GUIDELINES
- Light neutral background
- One accent color per category
- Rounded cards
- Subtle shadows only
- No dense text blocks

---

## FINAL UX RULE

If a screen makes the user ask:
"What am I supposed to do here?"

That screen is incorrect and must be simplified.


---

## FRONTEND IMPLEMENTATION CONTRACT (CURSOR-READY)

This section removes ambiguity so Cursor (and future you) can generate code **without guessing**.
Everything below should be treated as a **hard contract**, not suggestions.

---

## GLOBAL FRONTEND STACK ASSUMPTIONS

- Framework: React or React Native
- State management: simple global store (Zustand-style)
- API layer: REST (no GraphQL in MVP)
- Styling: component-based (no global CSS chaos)

---

## GLOBAL STATE SHAPE (SINGLE SOURCE OF TRUTH)

```
AppState {
  today: {
    day: Day
    betterItems: BetterItem[]
    tasks: Task[]
    discipline: DisciplineEntry
    diet: DietEntry
    currentBlock: ScheduleBlock
    deadlineWarning?: Deadline
  }

  schedule: ScheduleBlock[]
  deadlines: Deadline[]
  money: {
    income: IncomeEntry[]
    monthlyTotal
    daysSinceLastIncome
  }

  weeklyReview?: WeeklyReview

  ui: {
    loading
    error?
    notificationsEnabled
  }
}
```

Rule: **Frontend never computes summaries**. It displays what backend/AI provides.

---

## COMPONENT BREAKDOWN (BY SCREEN)

---

### HOME / TODAY

**Components**
- TodayHeader
- BetterTodayList
- BetterTodayItem
- CurrentBlockIndicator
- DisciplineQuickToggle
- DeadlineWarningBanner

**Props mapping**
```
BetterTodayItemProps {
  title
  completed
  category
  onToggle
}
```

---

### TASKS

**Components**
- TaskList
- TaskItem
- AddTaskButton

**Rules**
- AddTaskButton disabled when tasks.length >= 5

---

### SCHEDULE

**Components**
- ScheduleTimeline
- ScheduleBlockItem

**Rules**
- Read-only if date === today

---

### DISCIPLINE / DIET

**Components**
- DisciplineCard
- HabitToggle
- DietCard
- MealNoteInput

---

### MONEY

**Components**
- MoneySummaryCard
- IncomeList
- AddIncomeButton

---

### DEADLINES

**Components**
- DeadlineList
- DeadlineCard

---

### WEEKLY REVIEW

**Components**
- WeeklySummary (read-only)
- ReviewQuestionInput
- SubmitReviewButton

---

## API ENDPOINT MAP (FRONTEND → BACKEND)

### Today Data
```
GET /api/today
POST /api/better-items/{id}/complete
POST /api/tasks
POST /api/tasks/{id}/complete
POST /api/discipline
POST /api/diet
```

---

### Schedule
```
GET /api/schedule
PUT /api/schedule
```

---

### Deadlines
```
GET /api/deadlines
```

---

### Money
```
GET /api/money/summary
POST /api/money/income
```

---

### Weekly Review
```
GET /api/weekly-review
POST /api/weekly-review
```

---

## FRONTEND BEHAVIOR RULES (VERY IMPORTANT)

- No optimistic UI for critical actions (completion must succeed)
- Failed API call → subtle error banner, not modal
- Loading states must be calm (no spinners everywhere)

---

## WHAT THE FRONTEND MUST NEVER DO

- Never calculate trends
- Never infer motivation
- Never reorder priorities
- Never generate content

All intelligence lives in backend + AI.

---

## CURSOR INSTRUCTION BLOCK (FOR CODE GENERATION)

When generating frontend code:
- Follow this document strictly
- Do not invent new fields
- Do not add features
- Prefer clarity over abstraction
- Default to functional components

---

## FINAL IMPLEMENTATION RULE

If Cursor needs to guess, the specification is incomplete.
Update this document before writing code.


---

## EXAMPLE JSON RESPONSES (API → FRONTEND CONTRACT)

These examples are **authoritative**. Cursor should mirror them exactly.

---

### GET /api/today
```
{
  "day": { "date": "2026-02-05" },
  "betterItems": [
    { "id": "b1", "title": "Finish deadline API endpoint", "category": "work", "completed": false },
    { "id": "b2", "title": "Send 5 outreach messages", "category": "leverage", "completed": false }
  ],
  "tasks": [
    { "id": "t1", "title": "Fix auth bug", "category": "work", "completed": false }
  ],
  "discipline": { "gym": false, "walk": true, "cooked": false, "diet": true, "meditation": false, "water": true },
  "diet": { "compliant": true },
  "currentBlock": { "title": "Deep Work", "startTime": "10:00", "endTime": "12:00" },
  "deadlineWarning": { "id": "d1", "title": "Platform X", "daysLeft": 2, "status": "behind" }
}
```

---

### GET /api/schedule
```
[
  { "id": "s1", "title": "Deep Work", "startTime": "10:00", "endTime": "12:00" },
  { "id": "s2", "title": "Leverage", "startTime": "13:00", "endTime": "14:30" },
  { "id": "s3", "title": "Health", "startTime": "16:30", "endTime": "18:00" }
]
```

---

### GET /api/deadlines
```
[
  { "id": "d1", "title": "Platform X", "dueDate": "2026-02-07", "status": "behind" }
]
```

---

### GET /api/money/summary
```
{
  "monthlyTotal": 420,
  "daysSinceLastIncome": 6,
  "income": [
    { "id": "i1", "date": "2026-01-30", "source": "Client A", "amount": 420 }
  ]
}
```

---

### GET /api/weekly-review
```
{
  "aiSummary": "You showed up most days but avoided leverage tasks.",
  "completed": false
}
```

---

## DESIGN TOKENS (UI CONSISTENCY)

### Colors
- Background: #F7F7F7
- Surface: #FFFFFF
- Text Primary: #1A1A1A
- Text Secondary: #6B6B6B

Category accents:
- Work: #3B82F6
- Leverage: #10B981
- Health: #F59E0B
- Stability: #8B5CF6

---

### Spacing
- XS: 4px
- S: 8px
- M: 16px
- L: 24px
- XL: 32px

---

### Typography
- Font: System default (San Francisco / Roboto)
- Title: 20–22px, semibold
- Body: 15–16px, regular
- Caption: 12–13px

---

## ERROR & EMPTY STATES (REQUIRED)

### Home
- Empty BetterItems: "Choose one thing to move forward today."

### Tasks
- No tasks: "Add one task that makes today successful."

### Money
- No income yet: "No income logged yet. That’s okay. Keep building."

### Deadlines
- No active deadlines: "No urgent commitments right now."

### Global Error
- API failure: "Something didn’t load. Try again."

---

## FINAL BUILD READINESS CHECK

If Cursor has:
- Data models ✅
- API examples ✅
- Design tokens ✅
- UX rules ✅

Then code generation can begin safely.

