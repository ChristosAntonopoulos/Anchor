import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTaskStore } from '../store/useTaskStore';
import { useMealsStore } from '../store/useMealsStore';
import { useWeeklyReviewStore } from '../store/useWeeklyReviewStore';
import { useTodayStore } from '../store/useTodayStore';
import { syncLifeReminders } from '../utils/osNotifications';
import { findWaterGlasses } from '../utils/waterReminders';

export function useLifeReminders() {
  const tasks = useTaskStore((s) => s.todayFocus);
  const inbox = useTaskStore((s) => s.inboxItems);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const todayCard = useMealsStore((s) => s.todayCard);
  const fetchTodayCard = useMealsStore((s) => s.fetchTodayCard);
  const weeklyCompleted = useWeeklyReviewStore((s) => Boolean(s.data?.completed));
  const fetchWeeklyReview = useWeeklyReviewStore((s) => s.fetchWeeklyReview);
  const discipline = useTodayStore((s) => s.data?.discipline);
  const waterGlasses = findWaterGlasses(discipline);

  useEffect(() => {
    void fetchTasks();
    void fetchTodayCard();
    void fetchWeeklyReview();
  }, [fetchTasks, fetchTodayCard, fetchWeeklyReview]);

  useEffect(() => {
    void syncLifeReminders({
      tasks: [...tasks, ...inbox],
      todayCard,
      weeklyCompleted,
      waterGlasses,
    });
  }, [inbox, tasks, todayCard, weeklyCompleted, waterGlasses]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncLifeReminders({
          tasks: [...useTaskStore.getState().todayFocus, ...useTaskStore.getState().inboxItems],
          todayCard: useMealsStore.getState().todayCard,
          weeklyCompleted: Boolean(useWeeklyReviewStore.getState().data?.completed),
          waterGlasses: findWaterGlasses(useTodayStore.getState().data?.discipline),
        });
      }
    });
    return () => sub.remove();
  }, []);
}
