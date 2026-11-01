import { apiClient } from './api';
import { useTodayStore } from '../store/useTodayStore';
import { useTaskStore } from '../store/useTaskStore';
import { useCBTStore } from '../store/useCBTStore';
import type { AIInput } from '../types';

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_MS = 90000;
/** When GET /ai-input/{id} is unavailable (older API deploy), wait for fire-and-forget intake. */
const LEGACY_INTAKE_WAIT_MS = 12000;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPollEndpointMissing(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /404|not found/i.test(error.message);
}

async function tryGetAIInput(inputId: string): Promise<AIInput | null> {
  try {
    return await apiClient.getAIInput(inputId);
  } catch (error) {
    if (isPollEndpointMissing(error)) return null;
    throw error;
  }
}

export async function pollAIInputUntilDone(inputId: string): Promise<void> {
  const started = Date.now();
  let statusPollAvailable = true;

  while (Date.now() - started < MAX_POLL_MS) {
    if (!statusPollAvailable) {
      await sleep(LEGACY_INTAKE_WAIT_MS);
      return;
    }

    const input = await tryGetAIInput(inputId);
    if (input == null) {
      statusPollAvailable = false;
      continue;
    }

    if (input.status === 'completed') return;
    if (input.status === 'failed') {
      throw new Error(input.error ?? 'AI intake failed');
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('AI intake timed out — pull to refresh in a moment');
}

export async function refreshIntakeViews(): Promise<void> {
  const date = todayUtc();
  await Promise.all([
    useTodayStore.getState().fetchToday(),
    useTaskStore.getState().fetchTasks(),
    useCBTStore.getState().fetchCBTEntries(date),
    useCBTStore.getState().fetchMoodEntries(date, date),
    // No date filter — intake activities may use varied scheduledDate timestamps
    useCBTStore.getState().fetchBehavioralActivities(),
  ]);
}

export async function submitIntakeAndRefresh(text: string): Promise<void> {
  const input = await apiClient.submitAIInput(text);
  await pollAIInputUntilDone(input.id);
  await refreshIntakeViews();
}
