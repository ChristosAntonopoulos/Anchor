import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { subscribeMorningNative } from '../services/morningModeNative';
import { isKeyguardLocked } from '../services/deviceLock';
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
    void hydrate().then((result) => {
      // Open on cold start only for a real unlock or an already-active session
      // while the phone is unlocked (not keyguard / screen lock).
      void (async () => {
        if (await isKeyguardLocked()) return;
        if (result.activatedFromUnlock || result.takeover) {
          openMorning();
        }
      })();
    });
    const unsub = subscribeMorningNative(() => {
      void hydrate().then((result) => {
        if (result.activatedFromUnlock || result.takeover) {
          openMorning();
        }
      });
    });
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Sync only — screen lock wake must not count as lock-in.
        void hydrate().then(async (result) => {
          if (await isKeyguardLocked()) return;
          // Resume immersive only after a real pending unlock, not mere AppState.
          if (result.activatedFromUnlock) {
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

  return takeover;
}
