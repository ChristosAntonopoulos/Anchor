export const SESSION_DURATIONS = [2, 5, 15, 25] as const;
export const DEFAULT_SESSION_MINUTES = 5;

export type SessionDuration = (typeof SESSION_DURATIONS)[number];

export function resolveSessionMinutes(
  explicit?: number | null,
  lastExplicit?: number | null,
  profileDefault: number = DEFAULT_SESSION_MINUTES,
): number {
  const chosen = explicit ?? lastExplicit ?? profileDefault;
  if (SESSION_DURATIONS.includes(chosen as SessionDuration) || (chosen > 0 && chosen <= 90)) {
    return chosen;
  }
  return DEFAULT_SESSION_MINUTES;
}

export function looksSimpleTask(title: string, notes?: string | null): boolean {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return words.length <= 2 && !notes?.trim();
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function remainingMs(plannedMinutes: number | null | undefined, elapsedMs: number): number | null {
  if (!plannedMinutes || plannedMinutes <= 0) {
    return null;
  }
  return Math.max(0, plannedMinutes * 60_000 - elapsedMs);
}

export const STUCK_CHOICES = [
  { id: 'unclear', label: 'Unclear' },
  { id: 'too_large', label: 'Too large' },
  { id: 'missing', label: 'Missing something' },
  { id: 'worried', label: 'Worried about doing it badly' },
  { id: 'distracted', label: 'Distracted' },
  { id: 'no_time', label: 'Not enough time' },
  { id: 'other', label: 'Something else' },
] as const;
