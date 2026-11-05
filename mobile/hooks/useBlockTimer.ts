import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScheduleChecklistItem } from '../types';
import { playBlockTransitionSound } from '../utils/scheduleTimerSound';

const MIN_STEP_SECONDS = 30;

function stepSeconds(item: ScheduleChecklistItem | undefined): number {
  const minutes = Number(item?.durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return MIN_STEP_SECONDS;
  return Math.max(MIN_STEP_SECONDS, Math.floor(minutes * 60));
}

interface UseBlockTimerOptions {
  items: ScheduleChecklistItem[];
  onItemComplete: (itemId: string) => Promise<void>;
  onSessionComplete?: () => void;
}

export function useBlockTimer({ items, onItemComplete, onSessionComplete }: UseBlockTimerOptions) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [items]
  );
  const advancingRef = useRef(false);
  const sortedRef = useRef(sorted);
  sortedRef.current = sorted;

  const [activeIndex, setActiveIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);

  const activeItem = sorted[activeIndex];
  const nextItem = sorted[activeIndex + 1];
  const totalSeconds = stepSeconds(activeItem);
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - secondsLeft / totalSeconds)) : 0;

  const advance = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    try {
      const list = sortedRef.current;
      const current = list[activeIndex];
      if (current && !current.completed) {
        await onItemComplete(current.id);
      }

      await playBlockTransitionSound();

      const nextIncomplete = list.findIndex((item, idx) => idx > activeIndex && !item.completed);
      if (nextIncomplete === -1) {
        setRunning(false);
        setFinished(true);
        onSessionComplete?.();
        return;
      }

      setActiveIndex(nextIncomplete);
      setSecondsLeft(stepSeconds(list[nextIncomplete]));
      setFinished(false);
      setRunning(true);
    } catch (error) {
      console.warn('Timer advance failed:', error);
      setRunning(false);
    } finally {
      advancingRef.current = false;
    }
  }, [activeIndex, onItemComplete, onSessionComplete]);

  useEffect(() => {
    if (!running || finished || !started) return;

    if (secondsLeft <= 0) {
      void advance();
      return;
    }

    const id = setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(id);
  }, [running, finished, started, secondsLeft, advance]);

  const start = useCallback(() => {
    const list = sortedRef.current;
    const idx = list.findIndex((i) => !i.completed);
    if (idx === -1) {
      setFinished(true);
      setRunning(false);
      setStarted(true);
      return;
    }
    setActiveIndex(idx);
    setSecondsLeft(stepSeconds(list[idx]));
    setFinished(false);
    setRunning(true);
    setStarted(true);
  }, []);

  const pause = useCallback(() => setRunning(false), []);
  const resume = useCallback(() => setRunning(true), []);

  const skip = useCallback(async () => {
    setRunning(false);
    await advance();
  }, [advance]);

  const completeEarly = useCallback(async () => {
    setRunning(false);
    await advance();
  }, [advance]);

  return {
    sorted,
    activeItem,
    nextItem,
    activeIndex,
    secondsLeft,
    progress,
    running,
    finished,
    started,
    start,
    pause,
    resume,
    skip,
    completeEarly,
  };
}
