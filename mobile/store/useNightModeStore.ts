import { create } from 'zustand';
import {
  COPY,
  type NightEvent,
  type NightTomorrowPlan,
  type NightSession,
  emptyWaiting,
  fallbackTomorrowPlan,
  isNightTakeover,
  reduceNight,
} from '../utils/nightMode';
import { apiClient } from '../services/api';
import {
  consumeNightPending,
  getNightGate,
  loadNativeSessionJson,
  playNightChime,
  saveNativeSessionJson,
  stopNightSpeech,
} from '../services/nightModeNative';
import { useTaskStore } from './useTaskStore';

interface NightModeState {
  session: NightSession;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  dispatch: (event: NightEvent, now?: Date) => NightSession;
  prepareTomorrowPlan: () => Promise<void>;
  askHelp: (text?: string) => Promise<void>;
}

function parseSession(raw: string | null, now: Date): NightSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as NightSession;
    if (!parsed?.localDate || !parsed?.status) return null;
    return reduceNight(parsed, { type: 'tick' }, now);
  } catch {
    return null;
  }
}

let lastBackendSync = 0;

async function persist(session: NightSession, syncBackend: boolean): Promise<void> {
  await saveNativeSessionJson(JSON.stringify(session));
  const now = Date.now();
  if (!syncBackend && now - lastBackendSync < 15_000) return;
  lastBackendSync = now;
  void apiClient.syncNightSession(session).catch(() => undefined);
}

export const useNightModeStore = create<NightModeState>((set, get) => ({
  session: emptyWaiting(new Date()),
  hydrated: false,

  hydrate: async () => {
    const now = new Date();
    const stored = parseSession(await loadNativeSessionJson(), now);
    const gate = await getNightGate();
    const pending = await consumeNightPending();
    let session = reduceNight(stored, { type: 'civilRollover' }, now);
    const nativeActive = gate.status === 'ACTIVE' || gate.status === 'PAUSED' || pending;
    if (nativeActive && session.status !== 'COMPLETED' && session.status !== 'ENDED_EARLY') {
      session = reduceNight(session, { type: 'unlock', fromUserPresent: true }, now);
      if (gate.status === 'PAUSED' && session.status === 'ACTIVE') {
        session = reduceNight(session, { type: 'pause' }, now);
      }
    }
    set({ session, hydrated: true });
    await persist(session, true);
  },

  dispatch: (event, now = new Date()) => {
    const previous = get().session;
    let session = reduceNight(previous, event, now);
    if (event.type === 'tick' && session.chimePlayed && !previous.chimePlayed) {
      playNightChime();
    }
    if (event.type === 'pause' || event.type === 'confirmEnd' || session.status === 'COMPLETED' || session.status === 'ENDED_EARLY') {
      stopNightSpeech();
    }
    set({ session });
    void persist(session, event.type !== 'tick');
    return session;
  },

  prepareTomorrowPlan: async () => {
    const local = fallbackTomorrowPlan(useTaskStore.getState().todayFocus.find((task) => !task.completed));
    get().dispatch({ type: 'setTomorrowPlan', plan: local });
    try {
      const remote = await apiClient.getNightTomorrowPlan();
      if (remote?.firstPhysicalAction) {
        get().dispatch({ type: 'setTomorrowPlan', plan: remote });
      }
    } catch {
      // offline is fine
    }
  },

  askHelp: async (text) => {
    get().dispatch({ type: 'help' });
    if (!text) return;
    try {
      const reply = await apiClient.helpNight({
        step: get().session.currentStep,
        text,
      });
      if (reply) {
        get().dispatch({ type: 'help' });
        const session = get().session;
        session.helpText = reply;
        set({ session: { ...session, helpText: reply } });
        void persist({ ...session, helpText: reply }, true);
      }
    } catch {
      // keep the local two-sentence fallback
    }
  },
}));

export { COPY, isNightTakeover };
export type { NightTomorrowPlan };
