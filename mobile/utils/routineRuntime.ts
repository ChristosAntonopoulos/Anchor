/**
 * Runtime overrides for morning/night routines loaded from the API.
 * Catalog defaults remain the offline fallback; hydrate applies remote values.
 */
import type { RoutineStepDef, UnifiedRoutineDef } from './routineCatalog';
import {
  MORNING_ROUTINE,
  NIGHT_ROUTINE,
} from './routineCatalog';

type ModeKey = 'morning' | 'night';

const runtime: Record<ModeKey, UnifiedRoutineDef> = {
  morning: { ...MORNING_ROUTINE, steps: [...MORNING_ROUTINE.steps], shorterSteps: [...MORNING_ROUTINE.shorterSteps] },
  night: { ...NIGHT_ROUTINE, steps: [...NIGHT_ROUTINE.steps], shorterSteps: [...NIGHT_ROUTINE.shorterSteps] },
};

function normalizeKey(key: string | undefined | null): ModeKey | null {
  const k = (key ?? '').toLowerCase();
  if (k === 'morning') return 'morning';
  if (k === 'night' || k === 'evening') return 'night';
  return null;
}

export function applyRemoteRoutine(
  remote: Partial<UnifiedRoutineDef> & { key?: string; catalogVersion?: string } | null | undefined
): UnifiedRoutineDef | null {
  const key = normalizeKey(remote?.key);
  if (!key || !remote) return null;

  const base = runtime[key];
  const next: UnifiedRoutineDef = {
    ...base,
    title: remote.title ?? base.title,
    startTime: remote.startTime ?? base.startTime,
    endTime: remote.endTime ?? base.endTime,
    triggerHour: typeof remote.triggerHour === 'number' ? remote.triggerHour : base.triggerHour,
    triggerMinute: typeof remote.triggerMinute === 'number' ? remote.triggerMinute : base.triggerMinute,
    totalSeconds: typeof remote.totalSeconds === 'number' ? remote.totalSeconds : base.totalSeconds,
    steps: Array.isArray(remote.steps) && remote.steps.length > 0
      ? (remote.steps as RoutineStepDef[])
      : base.steps,
    shorterSteps: Array.isArray(remote.shorterSteps) && remote.shorterSteps.length > 0
      ? (remote.shorterSteps as RoutineStepDef[])
      : base.shorterSteps,
  };
  runtime[key] = next;
  return next;
}

export function getRuntimeRoutine(key: ModeKey): UnifiedRoutineDef {
  return runtime[key];
}

export function getRuntimeTrigger(key: ModeKey): { hour: number; minute: number } {
  const r = runtime[key];
  return { hour: r.triggerHour, minute: r.triggerMinute };
}

export function getRuntimeStepSeconds(key: ModeKey): Record<string, number> {
  return Object.fromEntries(runtime[key].steps.map((s) => [s.id, s.seconds]));
}

export function getRuntimeStepOrder(key: ModeKey): string[] {
  return runtime[key].steps.map((s) => s.id);
}

export function getRuntimeShorterStepOrder(key: ModeKey): string[] {
  return runtime[key].shorterSteps.map((s) => s.id);
}
