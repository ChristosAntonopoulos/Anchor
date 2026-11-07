import { create } from 'zustand';
import { apiClient } from '../services/api';
import type {
  DayPlan,
  ExecutionProfile,
  NowRecommendation,
  StuckHelp,
  WorkSession,
} from '../types';
import type { CapacityChoice, ExecutionReview, ReturnPointDraft } from '../types/execution';

interface ExecutionStore {
  profile: ExecutionProfile | null;
  now: NowRecommendation | null;
  session: WorkSession | null;
  dayPlan: DayPlan | null;
  stuck: StuckHelp | null;
  review: ExecutionReview | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  saveProfile: (patch: Partial<ExecutionProfile>) => Promise<void>;
  fetchNow: (params?: { capacity?: CapacityChoice; easier?: boolean; refresh?: boolean }) => Promise<void>;
  rejectNow: () => Promise<void>;
  start: (request: { taskId?: string; blockId?: string; minutes?: number; timerEnabled?: boolean; currentAction?: string }) => Promise<WorkSession>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  timeCheck: () => Promise<void>;
  captureDistraction: (text: string) => Promise<void>;
  finish: (request: { outcome?: string; returnPoint?: string; notes?: string }) => Promise<void>;
  planTask: (id: string) => Promise<import('../types').Task>;
  acceptPlan: (id: string, nextActionText?: string) => Promise<void>;
  askStuck: (request: { taskId?: string; explanation?: string; choice?: string; makeSmaller?: boolean }) => Promise<void>;
  useStuck: (suggestedAction?: string, taskId?: string) => Promise<void>;
  clearStuck: () => void;
  planToday: (scope?: 'today' | 'remaining') => Promise<void>;
  applyPlan: (mode: 'all' | 'first' | 'discard') => Promise<void>;
  recover: (action: 'shorter' | 'move' | 'leave' | 'replan') => Promise<void>;
  skipRoutine: (blockId: string) => Promise<void>;
  setRoutineVersion: (blockId: string, version: 'regular' | 'shorter') => Promise<void>;
  draftReturnPoint: (notes?: string) => Promise<ReturnPointDraft | null>;
  runReview: () => Promise<ExecutionReview | null>;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  profile: null,
  now: null,
  session: null,
  dayPlan: null,
  stuck: null,
  review: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    try {
      const profile = await apiClient.getExecutionProfile();
      set({ profile });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not load execution profile' });
    }
  },

  saveProfile: async (patch) => {
    const profile = await apiClient.updateExecutionProfile(patch);
    set({ profile });
  },

  fetchNow: async (params) => {
    set({ loading: true, error: null });
    try {
      const now = await apiClient.getNowRecommendation(params);
      set({
        now,
        session: now.activeSession ?? get().session,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Could not load what to do now',
        loading: false,
      });
    }
  },

  rejectNow: async () => {
    const taskId = get().now?.taskId;
    await apiClient.rejectNowSuggestion(taskId);
    await get().fetchNow({ refresh: true });
  },

  start: async (request) => {
    const session = await apiClient.startSession(request);
    set({ session, stuck: null });
    return session;
  },

  pause: async () => {
    const id = get().session?.id;
    if (!id) return;
    set({ session: await apiClient.pauseSession(id) });
  },

  resume: async () => {
    const id = get().session?.id;
    if (!id) return;
    set({ session: await apiClient.resumeSession(id) });
  },

  timeCheck: async () => {
    const id = get().session?.id;
    if (!id) return;
    set({ session: await apiClient.timeCheckSession(id) });
  },

  captureDistraction: async (text) => {
    const id = get().session?.id;
    if (!id) return;
    set({ session: await apiClient.captureDistraction(id, text) });
  },

  finish: async (request) => {
    const id = get().session?.id;
    if (!id) return;
    await apiClient.finishSession(id, request);
    set({ session: null });
    await get().fetchNow({ refresh: true });
  },

  planTask: async (id) => {
    return apiClient.planTask(id);
  },

  acceptPlan: async (id, nextActionText) => {
    await apiClient.acceptTaskPlan(id, nextActionText ? { edit: true, nextActionText } : {});
  },

  askStuck: async (request) => {
    const stuck = await apiClient.helpStuck({
      ...request,
      sessionId: get().session?.id,
    });
    set({ stuck });
  },

  useStuck: async (suggestedAction, taskId) => {
    const stuck = get().stuck;
    const session = get().session;
    if (!stuck) return;
    const action = suggestedAction?.trim() || stuck.suggestedAction;
    await apiClient.acceptStuck({
      sessionId: session?.id,
      taskId: session?.taskId ?? taskId ?? get().now?.taskId ?? undefined,
      suggestedAction: action,
      suggestedMinutes: stuck.suggestedMinutes,
    });
    if (session) {
      set({
        session: { ...session, currentAction: action },
        stuck: null,
      });
    } else {
      set({ stuck: null });
      await get().fetchNow({ refresh: true });
    }
  },

  clearStuck: () => set({ stuck: null }),

  planToday: async (scope = 'today') => {
    set({ loading: true, error: null });
    try {
      const dayPlan = await apiClient.planDay({ scope });
      set({ dayPlan, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Could not draft a plan',
        loading: false,
      });
    }
  },

  applyPlan: async (mode) => {
    const id = get().dayPlan?.id;
    if (!id) return;
    const dayPlan = await apiClient.applyDayPlan(id, mode);
    set({ dayPlan: mode === 'discard' ? null : dayPlan });
    await get().fetchNow({ refresh: true });
  },

  recover: async (action) => {
    if (action === 'replan') {
      await get().planToday('remaining');
      return;
    }
    const recovery = get().now?.recovery;
    const now = await apiClient.recoveryAction({
      action,
      blockId: recovery?.blockId,
      taskId: recovery?.taskId ?? undefined,
    });
    set({ now });
  },

  skipRoutine: async (blockId) => {
    await apiClient.skipRoutine(blockId);
  },

  setRoutineVersion: async (blockId, version) => {
    await apiClient.setRoutineVersion(blockId, version);
  },

  draftReturnPoint: async (notes) => {
    const id = get().session?.id;
    if (!id) return null;
    return apiClient.draftReturnPoint(id, notes);
  },

  runReview: async () => {
    try {
      const review = await apiClient.getExecutionReview();
      set({ review });
      await get().fetchProfile();
      return review;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not review patterns' });
      return null;
    }
  },
}));
