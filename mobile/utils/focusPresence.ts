import type { ScheduleBlock } from '../types';
import type { WorkSession } from '../types/execution';

export const FOCUS_PULSE_MS = 5 * 60 * 1000;
export const FOCUS_PREFIX = 'os:focus:';

export type FocusCueKind = 'start' | 'pulse';

export interface FocusCue {
  identifier: string;
  atMs: number;
  kind: FocusCueKind;
  title: string;
  body: string;
  url: string;
}

export interface FocusWindow {
  id: string;
  label: string;
  startMs: number;
  endMs: number;
}

function parseHm(value: string, now: Date): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
}

export function blockHasActiveTask(block: ScheduleBlock): boolean {
  if (block.skipped) return false;
  return Boolean(block.taskId || (block.taskTitle && block.taskTitle.trim()));
}

export function blockWindowMs(
  block: Pick<ScheduleBlock, 'startTime' | 'endTime'>,
  now: Date
): { startMs: number; endMs: number } | null {
  const start = parseHm(block.startTime, now);
  const end = parseHm(block.endTime, now);
  if (!start || !end) return null;
  let endMs = end.getTime();
  const startMs = start.getTime();
  if (endMs <= startMs) {
    endMs += 24 * 60 * 60 * 1000;
  }
  return { startMs, endMs };
}

export function focusWindows(
  blocks: ScheduleBlock[],
  session: WorkSession | null,
  nowMs: number
): FocusWindow[] {
  const windows: FocusWindow[] = [];
  const now = new Date(nowMs);

  for (const block of blocks) {
    if (!blockHasActiveTask(block)) continue;
    const span = blockWindowMs(block, now);
    if (!span || span.endMs <= nowMs) continue;
    windows.push({
      id: `block:${block.id}`,
      label: (block.taskTitle && block.taskTitle.trim()) || block.title,
      startMs: span.startMs,
      endMs: span.endMs,
    });
  }

  const sessionLive = session && (session.status === 'running' || session.status === 'time_check');
  if (sessionLive && session) {
    const started = session.startedAt ? Date.parse(session.startedAt) : nowMs;
    const startMs = Number.isFinite(started) ? started : nowMs;
    const plannedMs =
      session.plannedMinutes && session.plannedMinutes > 0
        ? session.plannedMinutes * 60_000
        : 3 * 60 * 60_000;
    const endMs = startMs + plannedMs;
    if (endMs > nowMs) {
      const blockKey = session.blockId ? `block:${session.blockId}` : null;
      const existing = blockKey ? windows.find((win) => win.id === blockKey) : undefined;
      const label = session.taskTitle || session.currentAction || 'Current task';
      if (existing) {
        existing.endMs = Math.max(existing.endMs, endMs);
        existing.label = label;
      } else {
        windows.push({
          id: `session:${session.id}`,
          label,
          startMs,
          endMs,
        });
      }
    }
  }

  return windows;
}

export function buildFocusCues(windows: FocusWindow[], nowMs: number): FocusCue[] {
  const cues: FocusCue[] = [];
  for (const win of windows) {
    const url = 'pos://os/now';
    if (win.startMs > nowMs + 2_000) {
      cues.push({
        identifier: `${FOCUS_PREFIX}start:${win.id}`,
        atMs: win.startMs,
        kind: 'start',
        title: 'This block started',
        body: win.label,
        url,
      });
    }

    let index = 1;
    for (let at = win.startMs + FOCUS_PULSE_MS; at < win.endMs; at += FOCUS_PULSE_MS, index += 1) {
      if (at <= nowMs + 2_000) continue;
      cues.push({
        identifier: `${FOCUS_PREFIX}pulse:${win.id}:${index}`,
        atMs: at,
        kind: 'pulse',
        title: win.label,
        body: 'Still in this block.',
        url,
      });
    }
  }
  return cues;
}

export function focusPlanFingerprint(cues: FocusCue[]): string {
  return cues.map((cue) => `${cue.identifier}@${cue.atMs}`).join('|');
}
