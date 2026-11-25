/**
 * Load morning/night routine definitions from the API into routineRuntime.
 * Catalog defaults stay as offline fallback until this succeeds.
 */
import { apiClient } from '../services/api';
import { applyRemoteRoutine, getRuntimeTrigger } from './routineRuntime';
import { setMorningTrigger } from '../services/morningModeNative';
import { setNightTrigger } from '../services/nightModeNative';

let lastLoadMs = 0;
const MIN_RELOAD_MS = 60_000;

export async function bootstrapRoutines(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastLoadMs < MIN_RELOAD_MS) return;
  lastLoadMs = now;

  try {
    const list = await apiClient.listRoutines();
    if (Array.isArray(list)) {
      for (const item of list) {
        applyRemoteRoutine(item);
      }
    }
  } catch {
    // Fall back to per-mode session payloads (no assistant key required).
    try {
      const morning = await apiClient.getMorningSession();
      if (morning?.routine) {
        applyRemoteRoutine({ ...morning.routine, key: morning.routine.key ?? 'morning' });
      }
    } catch {
      // offline
    }
    try {
      const night = await apiClient.getNightSession();
      if (night?.routine) {
        applyRemoteRoutine({ ...night.routine, key: night.routine.key ?? 'night' });
      }
    } catch {
      // offline
    }
  }

  const morningTrigger = getRuntimeTrigger('morning');
  const nightTrigger = getRuntimeTrigger('night');
  await Promise.all([
    setMorningTrigger(morningTrigger.hour, morningTrigger.minute),
    setNightTrigger(nightTrigger.hour, nightTrigger.minute),
  ]);
}
