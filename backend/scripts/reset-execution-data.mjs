#!/usr/bin/env node
/**
 * Removes execution-support collections and unsets execution fields.
 * Does not delete tasks, notes, check-ins, or other application data.
 *
 * Requires CONFIRM_RESET_EXECUTION=yes
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MongoDb__ConnectionString || process.env.MONGODB_URI;
const dbName = process.env.MongoDb__DatabaseName || process.env.MONGODB_DB || 'pos';

if (process.env.CONFIRM_RESET_EXECUTION !== 'yes') {
  console.error('Refusing to run. Set CONFIRM_RESET_EXECUTION=yes');
  process.exit(1);
}

if (!uri) {
  console.error('Set MongoDb__ConnectionString or MONGODB_URI');
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const dropped = [];
for (const name of ['executionProfiles', 'workSessions', 'dayPlanDrafts']) {
  try {
    await db.collection(name).drop();
    dropped.push(name);
  } catch (error) {
    if (error.codeName !== 'NamespaceNotFound') {
      throw error;
    }
  }
}

const tasks = await db.collection('tasks').updateMany({}, {
  $unset: {
    nextAction: 1,
    upcomingSteps: 1,
    definitionOfDone: 1,
    dependencies: 1,
    returnPoint: 1,
    pendingSuggestion: 1,
    rejectedSuggestionKeys: 1,
    stuckAttemptCount: 1,
    lastStuckApproach: 1,
  },
});

const instances = await db.collection('scheduleBlockInstances').updateMany({}, {
  $unset: {
    taskId: 1,
    entryAction: 1,
    startMinutes: 1,
    windowKind: 1,
    manualCue: 1,
    routineVersion: 1,
    skipped: 1,
    occurrenceEdited: 1,
  },
});

const definitions = await db.collection('scheduleBlockDefinitions').updateMany({}, {
  $unset: { shorterRoutineActivities: 1 },
});

console.log(JSON.stringify({
  dropped,
  tasksUnset: tasks.modifiedCount,
  scheduleInstancesUnset: instances.modifiedCount,
  scheduleDefinitionsUnset: definitions.modifiedCount,
}, null, 2));

await client.close();
