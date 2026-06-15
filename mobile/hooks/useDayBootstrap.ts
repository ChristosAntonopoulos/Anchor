import { useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../services/api';
import { useTodayStore } from '../store/useTodayStore';
import { useScheduleStore } from '../store/useScheduleStore';
import { useTaskStore } from '../store/useTaskStore';
import { useDayBootstrapStore } from '../store/useDayBootstrapStore';
import type { DayBootstrap } from '../types';

const POLL_MS = 2000;

export function useDayBootstrap(initial?: DayBootstrap | null) {
  const { bootstrap, showAssessment, setBootstrap, setShowAssessment } = useDayBootstrapStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<DayBootstrap['status'] | null>(null);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      useTodayStore.getState().fetchToday(),
      useScheduleStore.getState().fetchSchedule(),
      useTaskStore.getState().fetchTasks(),
    ]);
  }, []);

  const applyBootstrap = useCallback(
    (next: DayBootstrap) => {
      setBootstrap(next);
      const hasAssessment = Boolean(next.yesterdayAssessment?.summary);
      const shouldShow =
        !next.assessmentSeen &&
        (next.status === 'processing' ||
          next.status === 'pending' ||
          hasAssessment);
      if (shouldShow) {
        setShowAssessment(true);
      }
      if (next.status === 'ready' && prevStatusRef.current !== 'ready') {
        void refreshAll();
      }
      prevStatusRef.current = next.status;
    },
    [refreshAll, setBootstrap, setShowAssessment]
  );

  useEffect(() => {
    if (initial) {
      applyBootstrap(initial);
    }
  }, [initial, applyBootstrap]);

  useEffect(() => {
    if (bootstrap?.status !== 'processing') {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const status = await apiClient.getDayBootstrapStatus();
        applyBootstrap(status);
      } catch {
        // keep polling
      }
    };

    void poll();
    pollingRef.current = setInterval(poll, POLL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [bootstrap?.status, applyBootstrap]);

  const dismissAssessment = useCallback(async () => {
    setShowAssessment(false);
    try {
      await apiClient.markDayAssessmentSeen();
      setBootstrap(
        bootstrap
          ? { ...bootstrap, assessmentSeen: true }
          : { status: 'ready', assessmentSeen: true }
      );
    } catch {
      // dismissed locally anyway
    }
  }, [bootstrap, setBootstrap, setShowAssessment]);

  return {
    bootstrap,
    showAssessment,
    dismissAssessment,
    isProcessing: bootstrap?.status === 'processing',
  };
}
