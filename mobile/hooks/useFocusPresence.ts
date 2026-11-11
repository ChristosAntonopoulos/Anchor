import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useScheduleStore } from '../store/useScheduleStore';
import { useExecutionStore } from '../store/useExecutionStore';
import { syncFocusPresence } from '../utils/osNotifications';

export function useFocusPresence() {
  const blocks = useScheduleStore((s) => s.blocks);
  const fetchSchedule = useScheduleStore((s) => s.fetchSchedule);
  const session = useExecutionStore((s) => s.session);
  const fetchNow = useExecutionStore((s) => s.fetchNow);

  useEffect(() => {
    void fetchSchedule();
    void fetchNow();
  }, [fetchNow, fetchSchedule]);

  useEffect(() => {
    void syncFocusPresence({ blocks, session });
  }, [blocks, session]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void fetchSchedule();
        void fetchNow();
        void syncFocusPresence({
          blocks: useScheduleStore.getState().blocks,
          session: useExecutionStore.getState().session,
        });
      }
    });
    const tick = setInterval(() => {
      void syncFocusPresence({
        blocks: useScheduleStore.getState().blocks,
        session: useExecutionStore.getState().session,
      });
    }, 60_000);
    return () => {
      sub.remove();
      clearInterval(tick);
    };
  }, [fetchNow, fetchSchedule]);
}
