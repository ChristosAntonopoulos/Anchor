import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useExecutionStore } from '../store/useExecutionStore';
import { useTodayStore } from '../store/useTodayStore';
import { useMealsStore } from '../store/useMealsStore';

type OsWidgetNative = {
  updateSnapshot: (snapshot: {
    nowTitle: string;
    nowAction: string;
    mealTitle: string;
    mealMeta: string;
    blockTitle: string;
    blockMeta: string;
  }) => Promise<boolean>;
};

const native = NativeModules.OsWidgetModule as OsWidgetNative | undefined;

export function useOsWidgetSync() {
  const now = useExecutionStore((s) => s.now);
  const fetchNow = useExecutionStore((s) => s.fetchNow);
  const currentBlock = useTodayStore((s) => s.data?.currentBlock);
  const todayCard = useMealsStore((s) => s.todayCard);

  useEffect(() => {
    void fetchNow();
  }, [fetchNow]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !native?.updateSnapshot) return;
    const meal = todayCard?.nextMeal;
    void native.updateSnapshot({
      nowTitle: now?.taskTitle?.trim() || now?.nextAction?.trim() || 'Choose one thing',
      nowAction: now?.nextAction?.trim() && now.nextAction !== now.taskTitle ? now.nextAction : now?.reason ?? '',
      mealTitle: meal?.recipeName || todayCard?.actionableReminder || 'No meal set',
      mealMeta: meal ? meal.slot : '',
      blockTitle: currentBlock?.title || 'No block',
      blockMeta: currentBlock?.startTime && currentBlock?.endTime
        ? `${currentBlock.startTime}–${currentBlock.endTime}`
        : '',
    }).catch(() => undefined);
  }, [currentBlock, now, todayCard]);
}
