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
  setMorningTrigger,
  stopMorningSpeech,
} from '../services/morningModeNative';
import { applyRemoteRoutine, getRuntimeTrigger } from '../utils/routineRuntime';
import { bootstrapRoutines } from '../utils/routineBootstrap';
import { useTaskStore } from './useTaskStore';

interface MorningModeState {
  session: MorningSession;
  hydrated: boolean;
  /** True when the last hydrate consumed a real USER_PRESENT pending unlock. */
  lastActivatedFromUnlock: boolean;
  hydrate: () => Promise<{ activatedFromUnlock: boolean; takeover: boolean }>;
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

function applyRoutineAndTrigger(
  remote: Partial<import('../utils/routineCatalog').UnifiedRoutineDef> & {
    key?: string;
    catalogVersion?: string;
  } | null | undefined
) {
  if (!remote) return;
  applyRemoteRoutine({ ...remote, key: remote.key ?? 'morning' });
  const trigger = getRuntimeTrigger('morning');
  void setMorningTrigger(trigger.hour, trigger.minute);
}

export const useMorningModeStore = create<MorningModeState>((set, get) => ({
  session: emptyWaiting(new Date()),
  hydrated: false,
  lastActivatedFromUnlock: false,

  hydrate: async () => {
    const now = new Date();
    void bootstrapRoutines();
    let stored = parseSession(await loadNativeSessionJson(), now);

    // Always refresh routine definition from API; only replace session when waiting/empty.
    try {
      const remote = await apiClient.getMorningSession(
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
        stored = reduceMorning(remote.session as MorningSession, { type: 'tick' }, now);
      }
    } catch {
      // offline: keep local / empty waiting
    }

    const gate = await getMorningGate();
    // Only a consumed pending flag means a real USER_PRESENT unlock (not screen lock).
    const pending = await consumeMorningPending();
    let session = reduceMorning(stored, { type: 'civilRollover' }, now);
    let activatedFromUnlock = false;

    if (pending && session.status !== 'COMPLETED' && session.status !== 'ENDED_EARLY') {
      session = reduceMorning(session, { type: 'unlock', fromUserPresent: true }, now);
      activatedFromUnlock = session.status === 'ACTIVE' || session.status === 'PAUSED';
      if (gate.status === 'PAUSED' && session.status === 'ACTIVE') {
        session = reduceMorning(session, { type: 'pause' }, now);
      }
    }
    // Screen lock / AppState resume: never invent USER_PRESENT from gate ACTIVE alone.

    const takeover = isMorningTakeover(session);
    set({ session, hydrated: true, lastActivatedFromUnlock: activatedFromUnlock });
    await persist(session, true);
    return { activatedFromUnlock, takeover };
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
