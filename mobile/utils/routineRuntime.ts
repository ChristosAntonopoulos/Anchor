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

function sanitizeSteps(
  steps: Partial<RoutineStepDef>[] | null | undefined,
  fallback: RoutineStepDef[]
): RoutineStepDef[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    return fallback.map((s) => ({ ...s }));
  }
  return steps
    .filter((s): s is Partial<RoutineStepDef> => !!s && typeof s === 'object')
    .map((s, i) => {
      const fb = fallback[i] ?? fallback[0];
      const id = typeof s.id === 'string' && s.id.trim() ? s.id.trim() : fb?.id ?? `step-${i + 1}`;
      const title = typeof s.title === 'string' && s.title.trim() ? s.title.trim() : fb?.title ?? id;
      const seconds =
        typeof s.seconds === 'number' && Number.isFinite(s.seconds) && s.seconds > 0
          ? Math.floor(s.seconds)
          : fb?.seconds ?? 60;
      const command = typeof s.command === 'string' ? s.command : fb?.command ?? '';
      return { id, title, seconds, command };
    });
}

export function applyRemoteRoutine(
  remote: Partial<UnifiedRoutineDef> & { key?: string; catalogVersion?: string } | null | undefined
): UnifiedRoutineDef | null {
  const key = normalizeKey(remote?.key);
  if (!key || !remote) return null;

  const base = runtime[key];
  const steps = sanitizeSteps(remote.steps, base.steps);
  const shorterSteps = sanitizeSteps(remote.shorterSteps, base.shorterSteps);
  const totalFromSteps = steps.reduce((sum, s) => sum + s.seconds, 0);
  const next: UnifiedRoutineDef = {
    ...base,
    title: remote.title ?? base.title,
    startTime: remote.startTime ?? base.startTime,
    endTime: remote.endTime ?? base.endTime,
    triggerHour: typeof remote.triggerHour === 'number' ? remote.triggerHour : base.triggerHour,
    triggerMinute: typeof remote.triggerMinute === 'number' ? remote.triggerMinute : base.triggerMinute,
    totalSeconds:
      typeof remote.totalSeconds === 'number' && remote.totalSeconds > 0
        ? remote.totalSeconds
        : totalFromSteps > 0
          ? totalFromSteps
          : base.totalSeconds,
    steps,
    shorterSteps,
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
  const steps = Array.isArray(runtime[key].steps) ? runtime[key].steps : [];
  return Object.fromEntries(
    steps
      .filter((s) => s && typeof s.id === 'string')
      .map((s) => [s.id, typeof s.seconds === 'number' ? s.seconds : 60])
  );
}

export function getRuntimeStepOrder(key: ModeKey): string[] {
  const steps = Array.isArray(runtime[key].steps) ? runtime[key].steps : [];
  return steps.filter((s) => s && typeof s.id === 'string').map((s) => s.id);
}

export function getRuntimeShorterStepOrder(key: ModeKey): string[] {
  const steps = Array.isArray(runtime[key].shorterSteps) ? runtime[key].shorterSteps : [];
  return steps.filter((s) => s && typeof s.id === 'string').map((s) => s.id);
}
