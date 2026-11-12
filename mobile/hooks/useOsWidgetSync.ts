import { useEffect, useState } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import { useExecutionStore } from '../store/useExecutionStore';
import { useTodayStore } from '../store/useTodayStore';
import { useMealsStore } from '../store/useMealsStore';
import { apiClient } from '../services/api';
import type { LatestPipelineRun } from '../types';

type OsWidgetNative = {
  updateSnapshot: (snapshot: {
    nowTitle: string;
    nowAction: string;
    mealTitle: string;
    mealMeta: string;
    blockTitle: string;
    blockMeta: string;
    pipelineTitle: string;
    pipelineMeta: string;
    pipelineStatus: string;
  }) => Promise<boolean>;
};

const native = NativeModules.OsWidgetModule as OsWidgetNative | undefined;

const emptyPipeline: LatestPipelineRun = {
  available: false,
  status: 'unknown',
  title: 'No pipeline yet',
  subtitle: '',
  timezone: 'Europe/Athens',
};

export function useOsWidgetSync() {
  const now = useExecutionStore((s) => s.now);
  const fetchNow = useExecutionStore((s) => s.fetchNow);
  const currentBlock = useTodayStore((s) => s.data?.currentBlock);
  const todayCard = useMealsStore((s) => s.todayCard);
  const [pipeline, setPipeline] = useState<LatestPipelineRun>(emptyPipeline);

  useEffect(() => {
    void fetchNow();
  }, [fetchNow]);

  useEffect(() => {
    let cancelled = false;

    const loadPipeline = async () => {
      try {
        const latest = await apiClient.getLatestPipeline();
        if (!cancelled) {
          setPipeline(latest);
        }
      } catch {
        if (!cancelled) {
          setPipeline(emptyPipeline);
        }
      }
    };

    void loadPipeline();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void loadPipeline();
      }
    });
    const timer = setInterval(() => {
      void loadPipeline();
    }, 60_000);

    return () => {
      cancelled = true;
      sub.remove();
      clearInterval(timer);
    };
  }, []);

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
      pipelineTitle: pipeline.title || 'No pipeline yet',
      pipelineMeta: pipeline.subtitle || pipeline.message || '',
      pipelineStatus: pipeline.status || 'unknown',
    }).catch(() => undefined);
  }, [currentBlock, now, todayCard, pipeline]);
}
