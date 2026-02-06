# Database Schema Analysis and Recommendations

## Executive Summary

This document analyzes the database schema for consistency, identifies issues, and provides recommendations for improvements.

## Entity Usage Analysis

### ✅ Actively Used Entities (Data API)

**Core Entities:**
- `User` - User information
- `Day` - Daily anchor entity
- `AIJobRun` - AI job audit logs

**Day-Anchored Entities (Daily Data):**
- `BetterItem` - Daily focus items
- `Task` - Daily execution tasks
- `ScheduleBlockInstance` - Daily schedule blocks
- `DisciplineEntry` - Daily habit tracking
- `DietEntry` - Daily diet compliance

**Standalone Entities:**
- `Deadline` - Active deadlines (has DueDate, not day-anchored)
- `WeeklyReview` - Weekly reviews (has WeekId)
- `IncomeEntry` - Income events (has Date, but not day-anchored)
- `ScheduleBlockDefinition` - Schedule templates/rules

### 🔮 AI Service Only Entities (Future Use)

These entities are defined but not used by the Data API. They are intended for the **AI & Scheduling Service**:

- `BetterItemEvent` - Audit log for better item changes (AI service will write)
- `ScheduleBlockHistory` - Tracks completion of schedule blocks (AI service reads/writes)
- `DeadlineStatusSnapshot` - Daily deadline status tracking (AI service writes)
- `HabitDefinition` - Template for habits (AI service reads)
- `HabitInsight` - Weekly AI-generated habit insights (AI service writes)
- `DietRuleSet` - User's diet compliance rules (AI service reads)
- `MoneyInsight` - Weekly AI-generated money trends (AI service writes)

**Status**: Keep these entities - they are part of the AI service contract.

### ⚠️ Issues Identified

#### 1. IncomeEntry Inconsistency

**Current State:**
- `IncomeEntry` has a `Date` field but doesn't extend `DayAnchoredEntity`
- Queried by date ranges (monthly) in `MoneyService`
- Uses direct `MongoDbContext` access

**Analysis:**
- Income entries are **events** that happened on a date, not day-anchored activities
- However, they could benefit from `DayAnchoredEntity` for:
  - Consistency with other date-based entities
  - Using `DayAnchoredRepository` patterns
  - Getting `DayId` computed property
  - Better query patterns

**Recommendation**: 
- **Option A (Recommended)**: Make `IncomeEntry` extend `DayAnchoredEntity` for consistency
- **Option B**: Keep as-is but document why it's different (it's an event, not a day activity)

**Impact**: Low - current implementation works, but consistency would be better

#### 2. MoneySummary Entity Redundancy

**Current State:**
- `MoneySummary` entity exists in schema
- `MoneyService.GetMoneySummaryAsync()` computes summary on the fly from `IncomeEntry`
- Entity is never used

**Analysis:**
- Entity was likely intended for caching/precomputation
- Service computes it dynamically (which is fine for current scale)
- Entity creates confusion (exists but unused)

**Recommendation**: 
- **Remove the entity** - computation on fly is sufficient for current needs
- If performance becomes an issue later, can add caching layer without entity

**Impact**: Low - just cleanup

#### 3. Repository Pattern vs Direct Context Access

**Current State:**
- `BaseService` uses `IRepository<T>` pattern
- Most services (`TodayService`, `TaskService`, `MoneyService`, etc.) use `MongoDbContext` directly
- Repository infrastructure exists but underutilized

**Analysis:**
- Direct context access gives more flexibility for complex queries
- Repository pattern provides better testability and abstraction
- Mixed approach creates inconsistency

**Recommendation**:
- **Keep current approach** (direct context) for now because:
  - Services need complex date-based queries
  - MongoDB queries are straightforward
  - Direct access is more readable for this use case
- **Document the decision** in architecture docs
- Consider repositories if we need to:
  - Support multiple databases
  - Add complex query abstractions
  - Improve testability significantly

**Impact**: Medium - architectural decision, but current approach works

#### 4. Day Entity Minimal Value

**Current State:**
- `Day` entity only has `FocusCategory` field (never set)
- Created automatically in `TodayService` but mostly just an anchor
- Other entities use date filtering directly

**Analysis:**
- `Day` entity serves as an anchor/placeholder
- `FocusCategory` field suggests future feature (not implemented)
- Could potentially be removed and use date filtering only

**Recommendation**:
- **Keep Day entity** for now because:
  - Provides explicit day anchor in database
  - `FocusCategory` field suggests future feature
  - Minimal overhead
  - Makes day-based queries more explicit
- **Document** that `FocusCategory` is reserved for future use

**Impact**: Low - minimal overhead, potential future value

## Schema Consistency Review

### ✅ Good Patterns

1. **Clear Entity Hierarchy**:
   - `EntityBase` - Common fields (Id, UserId, CreatedAt, UpdatedAt)
   - `DayAnchoredEntity` - For day-specific entities
   - `DefinitionEntity` - For templates/rules

2. **Consistent Naming**:
   - Collections use plural forms
   - Entities use singular forms
   - DTOs follow consistent patterns

3. **Proper Indexing**:
   - Compound indexes on (UserId, Date) for day-anchored entities
   - Unique indexes where needed (Days, DisciplineEntries, DietEntries)
   - Date descending for IncomeEntries

### ⚠️ Inconsistencies

1. **IncomeEntry** - Has Date but doesn't extend DayAnchoredEntity
2. **Deadline** - Has DueDate (not Date) - this is correct (deadline is not day-anchored)
3. **MoneySummary** - Entity exists but unused

## Separation of Concerns

### Current Architecture

**Data Access Layer:**
- `MongoDbContext` - Direct MongoDB access
- `IRepository<T>` - Generic repository interface (exists but underused)
- Services use `MongoDbContext` directly

**Application Layer:**
- Services contain business logic
- Services handle data access directly
- DTOs for data transfer

**API Layer:**
- Controllers are thin
- Use services for business logic
- Handle HTTP concerns only

### Assessment

**✅ Good Separation:**
- Controllers → Services → Data (clear layers)
- DTOs separate from entities
- Services contain business logic

**⚠️ Could Improve:**
- Services directly depend on MongoDB (not abstracted)
- No repository pattern usage (but may not be needed)

**Recommendation**: Current separation is acceptable for MongoDB-based system. Repository pattern would add abstraction but may be overkill.

## Recommendations Summary

### High Priority

1. **Fix IncomeEntry** - Make extend `DayAnchoredEntity` for consistency
2. **Remove MoneySummary Entity** - Unused, computed on fly

### Medium Priority

3. **Document Unused Entities** - Mark as "AI Service Only" (done in this doc)
4. **Document Architecture Decision** - Why direct context access vs repositories

### Low Priority

5. **Review Day Entity** - Keep for now, document FocusCategory future use
6. **Consider Entity Consolidation** - Not needed, entities are well-separated

## Entity Relationship Diagram

```
User (1) ──┐
           │
           ├──> Day (1 per day per user)
           │     └──> FocusCategory (future)
           │
           ├──> BetterItem (N per day)
           ├──> Task (N per day)
           ├──> ScheduleBlockInstance (N per day)
           ├──> DisciplineEntry (1 per day)
           ├──> DietEntry (1 per day)
           │
           ├──> Deadline (N, has DueDate)
           ├──> WeeklyReview (1 per week, has WeekId)
           ├──> IncomeEntry (N, has Date) ⚠️ Should be DayAnchoredEntity?
           │
           ├──> ScheduleBlockDefinition (N, templates)
           │
           └──> AIJobRun (N, audit logs)

AI Service Only:
  - BetterItemEvent (audit)
  - ScheduleBlockHistory (completion tracking)
  - DeadlineStatusSnapshot (daily tracking)
  - HabitDefinition (templates)
  - HabitInsight (AI insights)
  - DietRuleSet (rules)
  - MoneyInsight (AI insights)
```

## Next Steps

1. Implement IncomeEntry fix (extend DayAnchoredEntity)
2. Remove MoneySummary entity
3. Add XML comments to AI Service Only entities
4. Document architecture decisions
