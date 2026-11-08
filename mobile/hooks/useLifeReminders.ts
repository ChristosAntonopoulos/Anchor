import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTaskStore } from '../store/useTaskStore';
import { useMealsStore } from '../store/useMealsStore';
import { useWeeklyReviewStore } from '../store/useWeeklyReviewStore';
import { syncLifeReminders } from '../utils/osNotifications';

export function useLifeReminders() {
  const tasks = useTaskStore((s) => s.todayFocus);
  const inbox = useTaskStore((s) => s.inboxItems);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const todayCard = useMealsStore((s) => s.todayCard);
  const fetchTodayCard = useMealsStore((s) => s.fetchTodayCard);
  const weeklyCompleted = useWeeklyReviewStore((s) => Boolean(s.data?.completed));
  const fetchWeeklyReview = useWeeklyReviewStore((s) => s.fetchWeeklyReview);

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
    });
  }, [inbox, tasks, todayCard, weeklyCompleted]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncLifeReminders({
          tasks: [...useTaskStore.getState().todayFocus, ...useTaskStore.getState().inboxItems],
          todayCard: useMealsStore.getState().todayCard,
          weeklyCompleted: Boolean(useWeeklyReviewStore.getState().data?.completed),
        });
      }
    });
    return () => sub.remove();
  }, []);
}
