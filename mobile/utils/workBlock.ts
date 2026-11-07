import { CURRENT_WORK_SENTINEL } from '../constants/work';
import type { ScheduleBlock } from '../types';

export function workPath(blockId?: string | null): `/work/${string}` {
  const id = blockId?.trim() || CURRENT_WORK_SENTINEL;
  return `/work/${encodeURIComponent(id)}`;
}

export function resolveWorkBlock(
  blockId: string | undefined,
  current: ScheduleBlock | null | undefined,
  blocks: ScheduleBlock[],
): ScheduleBlock | null {
  const id = blockId?.trim();
  if (!id || id === CURRENT_WORK_SENTINEL) {
    return current ?? null;
  }
  const fromSchedule = blocks.find((block) => block.id === id);
  if (fromSchedule) {
    return fromSchedule;
  }
  if (current?.id === id) {
    return current;
  }
  return null;
}

export function currentWorkStep(block: ScheduleBlock | null | undefined) {
  const items = block?.checklistItems ?? [];
  return items.find((item) => !item.completed) ?? null;
}

export function blockKindLabel(block: ScheduleBlock): string {
  if (block.windowKind === 'exact') {
    return 'Fixed commitment';
  }
  if (block.isRoutine) {
    return 'Routine';
  }
  return 'Scheduled work';
}
