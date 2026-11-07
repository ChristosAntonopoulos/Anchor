# Reset execution-support data

This script removes **only** the execution-support collections and the execution fields added to tasks and schedule blocks. It does **not** delete notes, check-in entries, money, discipline, phone unlocks, or other application data.

## What it removes

- Collection `executionProfiles`
- Collection `workSessions`
- Collection `dayPlanDrafts`

## What it unsets on existing documents

On `tasks`:
`nextAction`, `upcomingSteps`, `definitionOfDone`, `dependencies`, `returnPoint`, `pendingSuggestion`, `rejectedSuggestionKeys`, `stuckAttemptCount`, `lastStuckApproach`

On `scheduleBlockInstances`:
`taskId`, `entryAction`, `startMinutes`, `windowKind`, `manualCue`, `routineVersion`, `skipped`, `occurrenceEdited`

On `scheduleBlockDefinitions`:
`shorterRoutineActivities`

## How to run

From the backend host, with MongoDB reachable:

```bash
node backend/scripts/reset-execution-data.mjs
```

Environment:
- `MongoDb__ConnectionString` or `MONGODB_URI` (required)
- `MongoDb__DatabaseName` (default `pos`)
- `CONFIRM_RESET_EXECUTION=yes` (required)

The script refuses to run without the confirmation variable.
