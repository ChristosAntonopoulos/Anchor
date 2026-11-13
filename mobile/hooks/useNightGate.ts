import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { subscribeNightNative } from '../services/nightModeNative';
import { isNightTakeover, useNightModeStore } from '../store/useNightModeStore';

function openNight() {
  try {
    router.replace('/night' as never);
  } catch {
    // route mounts with the app
  }
}

export function useNightGate(): boolean {
  const session = useNightModeStore((s) => s.session);
  const hydrate = useNightModeStore((s) => s.hydrate);
  const takeover = isNightTakeover(session);

  useEffect(() => {
    void hydrate().then(() => {
      if (isNightTakeover(useNightModeStore.getState().session)) {
        openNight();
      }
    });
    const unsub = subscribeNightNative(() => {
      void hydrate().then(openNight);
    });
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void hydrate().then(() => {
          if (isNightTakeover(useNightModeStore.getState().session)) {
            openNight();
          }
        });
      }
    });
    return () => {
      unsub();
      app.remove();
    };
  }, [hydrate]);

  useEffect(() => {
    if (takeover) openNight();
  }, [takeover]);

  return takeover;
}
