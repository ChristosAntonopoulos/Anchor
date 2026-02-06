# Database Schema Improvements Plan

## Overview

Based on the schema analysis, this plan outlines specific improvements to make the database schema more consistent, remove redundancies, and improve maintainability.

## Analysis Summary

See `SCHEMA_ANALYSIS.md` for detailed analysis. Key findings:
- ✅ Schema is generally well-designed
- ⚠️ Some inconsistencies (IncomeEntry, MoneySummary)
- ✅ Good separation of concerns
- ✅ AI Service Only entities are correctly identified

## Recommended Improvements

### Priority 1: High Impact, Low Risk

#### 1.1 Make IncomeEntry Extend DayAnchoredEntity

**Rationale:**
- IncomeEntry has a `Date` field and is queried by date
- Extending `DayAnchoredEntity` provides:
  - Consistency with other date-based entities
  - `DayId` computed property
  - Ability to use day-anchored repository patterns
  - Better query patterns

**Implementation:**
- Change `IncomeEntry` to extend `DayAnchoredEntity`
- Update `MoneyService` to use date filtering (already compatible)
- Update seeders to set `Date` properly (already done)
- Verify indexes work correctly (already has UserId + Date index)

**Files to Modify:**
- `backend/src/POS.Core/Entities/Money/IncomeEntry.cs`

**Risk**: Low - only changes inheritance, existing queries work the same

#### 1.2 Remove MoneySummary Entity

**Rationale:**
- Entity exists but is never used
- `MoneyService` computes summary on the fly (sufficient for current needs)
- Creates confusion (entity exists but unused)
- Can add caching later if needed without this entity

**Implementation:**
- Delete `MoneySummary.cs` entity file
- Remove from `MongoDbContext.cs`
- Remove from `MongoDbConfiguration.cs` (if indexed)
- Verify no references exist

**Files to Modify:**
- `backend/src/POS.Core/Entities/Money/MoneySummary.cs` (DELETE)
- `backend/src/POS.Infrastructure/Data/MongoDbContext.cs`
- `backend/src/POS.Infrastructure/Data/MongoDbConfiguration.cs` (if indexed)

**Risk**: Low - entity is unused

### Priority 2: Documentation and Clarity

#### 2.1 Document AI Service Only Entities

**Rationale:**
- Several entities exist but aren't used by Data API
- They are for the AI & Scheduling Service
- Should be clearly documented to avoid confusion

**Implementation:**
- Add XML comments to AI Service Only entities
- Create summary document listing them
- Update README to reference AI service entities

**Files to Modify:**
- Add comments to:
  - `BetterItemEvent.cs`
  - `ScheduleBlockHistory.cs`
  - `DeadlineStatusSnapshot.cs`
  - `HabitDefinition.cs`
  - `HabitInsight.cs`
  - `DietRuleSet.cs`
  - `MoneyInsight.cs`

**Risk**: None - documentation only

#### 2.2 Document Architecture Decision (Repository vs Direct Context)

**Rationale:**
- Services use `MongoDbContext` directly instead of repositories
- This is an architectural decision that should be documented
- Prevents confusion about why repositories exist but aren't used

**Implementation:**
- Add architecture decision record
- Document in README or architecture docs
- Explain when to use repositories vs direct context

**Files to Create/Modify:**
- `backend/ARCHITECTURE.md` (new file)
- Or add section to `backend/README.md`

**Risk**: None - documentation only

#### 2.3 Document Day Entity Future Use

**Rationale:**
- `Day` entity has `FocusCategory` field that's never set
- Should document this is reserved for future feature

**Implementation:**
- Add XML comment to `FocusCategory` property
- Document in schema analysis

**Files to Modify:**
- `backend/src/POS.Core/Entities/Day.cs`

**Risk**: None - documentation only

## Implementation Plan

### Phase 1: Fix Inconsistencies

1. **Make IncomeEntry extend DayAnchoredEntity**
   - Update entity class
   - Verify all queries still work
   - Test with existing data

2. **Remove MoneySummary entity**
   - Delete entity file
   - Remove from context
   - Remove from configuration
   - Verify no references

### Phase 2: Documentation

3. **Document AI Service Only entities**
   - Add XML comments to each entity
   - Create entity usage reference

4. **Document architecture decisions**
   - Create architecture documentation
   - Explain repository vs direct context decision

5. **Document Day entity future use**
   - Add comment to FocusCategory

## Files to Modify

### Entities
1. `backend/src/POS.Core/Entities/Money/IncomeEntry.cs` - Extend DayAnchoredEntity
2. `backend/src/POS.Core/Entities/Money/MoneySummary.cs` - DELETE
3. `backend/src/POS.Core/Entities/Day.cs` - Add FocusCategory documentation
4. AI Service Only entities - Add documentation comments

### Infrastructure
5. `backend/src/POS.Infrastructure/Data/MongoDbContext.cs` - Remove MoneySummary collection
6. `backend/src/POS.Infrastructure/Data/MongoDbConfiguration.cs` - Remove MoneySummary indexes (if any)

### Documentation
7. `backend/ARCHITECTURE.md` - Create architecture decision document
8. `backend/README.md` - Add reference to AI service entities

## Testing Checklist

After implementing changes:

- [ ] IncomeEntry queries still work correctly
- [ ] MoneyService still computes summaries correctly
- [ ] No build errors
- [ ] No runtime errors
- [ ] Seeder still works
- [ ] All API endpoints return correct data

## Rollback Plan

If issues arise:
1. IncomeEntry change is easy to revert (just change inheritance back)
2. MoneySummary deletion can be restored from git
3. Documentation changes are non-breaking

## Success Criteria

✅ **Improvements Complete When:**
1. IncomeEntry extends DayAnchoredEntity (consistency)
2. MoneySummary entity removed (no unused entities)
3. AI Service Only entities documented
4. Architecture decisions documented
5. All tests pass
6. No breaking changes

## Notes

- IncomeEntry change improves consistency but current implementation works fine
- MoneySummary removal is cleanup - entity was never used
- Documentation improvements help future developers understand the architecture
- All changes are low-risk and can be tested incrementally
