import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { subscribeMorningNative } from '../services/morningModeNative';
import { isMorningTakeover, useMorningModeStore } from '../store/useMorningModeStore';

function openMorning() {
  try {
    router.replace('/morning' as never);
  } catch {
    // route mounts with the app
  }
}

export function useMorningGate(): boolean {
  const session = useMorningModeStore((s) => s.session);
  const hydrate = useMorningModeStore((s) => s.hydrate);
  const takeover = isMorningTakeover(session);

  useEffect(() => {
    void hydrate().then(() => {
      if (isMorningTakeover(useMorningModeStore.getState().session)) {
        openMorning();
      }
    });
    const unsub = subscribeMorningNative(() => {
      void hydrate().then(openMorning);
    });
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void hydrate().then(() => {
          if (isMorningTakeover(useMorningModeStore.getState().session)) {
            openMorning();
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
    if (takeover) openMorning();
  }, [takeover]);

  return takeover;
}
