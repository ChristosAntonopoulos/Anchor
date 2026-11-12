import { create } from 'zustand';
import {
  COPY,
  type MorningEvent,
  type MorningFirstTask,
  type MorningSession,
  emptyWaiting,
  fallbackFirstTask,
  isMorningTakeover,
  reduceMorning,
} from '../utils/morningMode';
import { apiClient } from '../services/api';
import {
  consumeMorningPending,
  getMorningGate,
  loadNativeSessionJson,
  playMorningChime,
  saveNativeSessionJson,
  stopMorningSpeech,
} from '../services/morningModeNative';
import { useTaskStore } from './useTaskStore';

interface MorningModeState {
  session: MorningSession;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  dispatch: (event: MorningEvent, now?: Date) => MorningSession;
  prepareFirstTask: () => Promise<void>;
  askHelp: (text?: string) => Promise<void>;
}

function parseSession(raw: string | null, now: Date): MorningSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MorningSession;
    if (!parsed?.localDate || !parsed?.status) return null;
    return reduceMorning(parsed, { type: 'tick' }, now);
  } catch {
    return null;
  }
}

let lastBackendSync = 0;

async function persist(session: MorningSession, syncBackend: boolean): Promise<void> {
  await saveNativeSessionJson(JSON.stringify(session));
  const now = Date.now();
  if (!syncBackend && now - lastBackendSync < 15_000) return;
  lastBackendSync = now;
  void apiClient.syncMorningSession(session).catch(() => undefined);
}

export const useMorningModeStore = create<MorningModeState>((set, get) => ({
  session: emptyWaiting(new Date()),
  hydrated: false,

  hydrate: async () => {
    const now = new Date();
    const stored = parseSession(await loadNativeSessionJson(), now);
    const gate = await getMorningGate();
    const pending = await consumeMorningPending();
    let session = reduceMorning(stored, { type: 'civilRollover' }, now);
    const nativeActive = gate.status === 'ACTIVE' || gate.status === 'PAUSED' || pending;
    if (nativeActive && session.status !== 'COMPLETED' && session.status !== 'ENDED_EARLY') {
      session = reduceMorning(session, { type: 'unlock', fromUserPresent: true }, now);
      if (gate.status === 'PAUSED' && session.status === 'ACTIVE') {
        session = reduceMorning(session, { type: 'pause' }, now);
      }
    }
    set({ session, hydrated: true });
    await persist(session, true);
  },

  dispatch: (event, now = new Date()) => {
    const previous = get().session;
    let session = reduceMorning(previous, event, now);
    if (event.type === 'tick' && session.chimePlayed && !previous.chimePlayed) {
      playMorningChime();
    }
    if (event.type === 'pause' || event.type === 'confirmEnd' || session.status === 'COMPLETED' || session.status === 'ENDED_EARLY') {
      stopMorningSpeech();
    }
    set({ session });
    void persist(session, event.type !== 'tick');
    return session;
  },

  prepareFirstTask: async () => {
    const local = fallbackFirstTask(useTaskStore.getState().todayFocus.find((task) => !task.completed));
    get().dispatch({ type: 'setFirstTask', task: local });
    try {
      const remote = await apiClient.getMorningFirstTask();
      if (remote?.firstPhysicalAction) {
        get().dispatch({ type: 'setFirstTask', task: remote });
      }
    } catch {
      // offline is fine
    }
  },

  askHelp: async (text) => {
    get().dispatch({ type: 'help' });
    if (!text) return;
    try {
      const reply = await apiClient.helpMorning({
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

export { COPY, isMorningTakeover };
export type { MorningFirstTask };
