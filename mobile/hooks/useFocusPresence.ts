import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useScheduleStore } from '../store/useScheduleStore';
import { useExecutionStore } from '../store/useExecutionStore';
import { clearFocusPresence, syncFocusPresence } from '../utils/osNotifications';
import { isKeyguardLocked } from '../services/deviceLock';

/** Safety-net only; primary updates are event-driven (schedule/session/AppState). */
const SAFETY_NET_MS = 15 * 60_000;

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
    void (async () => {
      if (AppState.currentState !== 'active') return;
      if (await isKeyguardLocked()) {
        await clearFocusPresence();
        return;
      }
      await syncFocusPresence({ blocks, session });
    })();
  }, [blocks, session]);

  useEffect(() => {
    const run = async (forceClear = false) => {
      if (forceClear || AppState.currentState !== 'active' || (await isKeyguardLocked())) {
        await clearFocusPresence();
        return;
      }
      await syncFocusPresence({
        blocks: useScheduleStore.getState().blocks,
        session: useExecutionStore.getState().session,
      });
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void fetchSchedule();
        void fetchNow();
        void run(false);
      } else {
        // Screen lock / background: stop focus lock-in pulses.
        void clearFocusPresence();
      }
    });
    const tick = setInterval(() => {
      void run(false);
    }, SAFETY_NET_MS);
    return () => {
      sub.remove();
      clearInterval(tick);
    };
  }, [fetchNow, fetchSchedule]);
}
