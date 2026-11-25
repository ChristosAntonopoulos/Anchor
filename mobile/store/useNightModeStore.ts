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
  setNightTrigger,
  stopNightSpeech,
} from '../services/nightModeNative';
import { applyRemoteRoutine, getRuntimeTrigger } from '../utils/routineRuntime';
import { bootstrapRoutines } from '../utils/routineBootstrap';
import { useTaskStore } from './useTaskStore';

interface NightModeState {
  session: NightSession;
  hydrated: boolean;
  /** True when the last hydrate consumed a real USER_PRESENT pending unlock. */
  lastActivatedFromUnlock: boolean;
  hydrate: () => Promise<{ activatedFromUnlock: boolean; takeover: boolean }>;
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

function applyRoutineAndTrigger(
  remote: Partial<import('../utils/routineCatalog').UnifiedRoutineDef> & {
    key?: string;
    catalogVersion?: string;
  } | null | undefined
) {
  if (!remote) return;
  applyRemoteRoutine({ ...remote, key: remote.key ?? 'night' });
  const trigger = getRuntimeTrigger('night');
  void setNightTrigger(trigger.hour, trigger.minute);
}

export const useNightModeStore = create<NightModeState>((set, get) => ({
  session: emptyWaiting(new Date()),
  hydrated: false,
  lastActivatedFromUnlock: false,

  hydrate: async () => {
    const now = new Date();
    void bootstrapRoutines();
    let stored = parseSession(await loadNativeSessionJson(), now);

    try {
      const remote = await apiClient.getNightSession(
        stored?.localDate ?? undefined,
        stored?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      if (remote?.routine) {
        applyRoutineAndTrigger(remote.routine);
      }
      const waiting =
        !stored ||
        stored.status === 'NOT_DUE' ||
        stored.status === 'WAITING_FOR_FIRST_UNLOCK';
      if (waiting && remote?.session?.localDate && remote.session.status) {
        stored = reduceNight(remote.session as NightSession, { type: 'tick' }, now);
      }
    } catch {
      // offline: keep local / empty waiting
    }

    const gate = await getNightGate();
    const pending = await consumeNightPending();
    let session = reduceNight(stored, { type: 'civilRollover' }, now);
    let activatedFromUnlock = false;

    if (pending && session.status !== 'COMPLETED' && session.status !== 'ENDED_EARLY') {
      session = reduceNight(session, { type: 'unlock', fromUserPresent: true }, now);
      activatedFromUnlock = session.status === 'ACTIVE' || session.status === 'PAUSED';
      if (gate.status === 'PAUSED' && session.status === 'ACTIVE') {
        session = reduceNight(session, { type: 'pause' }, now);
      }
    }

    const takeover = isNightTakeover(session);
    set({ session, hydrated: true, lastActivatedFromUnlock: activatedFromUnlock });
    await persist(session, true);
    return { activatedFromUnlock, takeover };
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
