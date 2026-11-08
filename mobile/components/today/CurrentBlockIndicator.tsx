import { HomeRow } from './HomeRow';
import type { ScheduleBlock } from '../../types';

interface CurrentBlockIndicatorProps {
  block: ScheduleBlock | null | undefined;
  onOpen?: () => void;
}

export function CurrentBlockIndicator({ block, onOpen }: CurrentBlockIndicatorProps) {
  if (!block?.title) {
    return null;
  }

  return (
    <HomeRow
      icon="calendar"
      label="Block"
      title={block.title}
      meta={`${block.startTime} – ${block.endTime}`}
      onPress={onOpen}
    />
  );
}
