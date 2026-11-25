import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { subscribeNightNative } from '../services/nightModeNative';
import { isKeyguardLocked } from '../services/deviceLock';
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
    void hydrate().then((result) => {
      void (async () => {
        if (await isKeyguardLocked()) return;
        if (result.activatedFromUnlock || result.takeover) {
          openNight();
        }
      })();
    });
    const unsub = subscribeNightNative(() => {
      void hydrate().then((result) => {
        if (result.activatedFromUnlock || result.takeover) {
          openNight();
        }
      });
    });
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void hydrate().then(async (result) => {
          if (await isKeyguardLocked()) return;
          if (result.activatedFromUnlock) {
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

  return takeover;
}
