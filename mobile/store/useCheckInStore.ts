import { create } from 'zustand';
import { apiClient } from '../services/api';
import { deviceTimezone } from '../utils/checkIn';
import type {
  ActivityTemplate,
  BehavioralActivity,
  CBTEntry,
  CheckInAssistRequest,
  CheckInAssistResponse,
  CreateActivityAttemptRequest,
  CreateBehavioralActivityRequest,
  CreateCBTEntryRequest,
  FeelingRating,
  ProblemSolvingRecord,
  UpdateCBTEntryRequest,
} from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface CheckInStore {
  entries: CBTEntry[];
  plans: BehavioralActivity[];
  templates: ActivityTemplate[];
  current: CBTEntry | null;
  draftId: string | null;
  assist: CheckInAssistResponse | null;
  saveStatus: SaveStatus;
  loading: boolean;
  error: string | null;
  dismissedTemplateIds: string[];
  excludedTemplateIds: string[];
  usePreviousEntries: boolean;

  loadLanding: () => Promise<void>;
  loadHistory: (type?: string) => Promise<void>;
  loadPlans: (checkInId?: string) => Promise<void>;
  loadTemplates: () => Promise<void>;
  openEntry: (id: string) => Promise<CBTEntry | null>;
  createDraft: (request: CreateCBTEntryRequest) => Promise<CBTEntry>;
  updateCurrent: (request: UpdateCBTEntryRequest) => Promise<CBTEntry | null>;
  saveAndClose: () => Promise<CBTEntry | null>;
  chooseSupport: (supportType: string) => Promise<CBTEntry | null>;
  requestAssist: (request?: CheckInAssistRequest) => Promise<CheckInAssistResponse | null>;
  saveThought: (request: UpdateCBTEntryRequest) => Promise<CBTEntry | null>;
  saveProblem: (record: ProblemSolvingRecord) => Promise<CBTEntry | null>;
  createPlan: (request: CreateBehavioralActivityRequest) => Promise<BehavioralActivity>;
  updatePlan: (id: string, request: Parameters<typeof apiClient.updateActivityPlan>[1]) => Promise<BehavioralActivity | null>;
  recordAttempt: (id: string, request: CreateActivityAttemptRequest) => Promise<BehavioralActivity | null>;
  linkTask: (id: string) => Promise<string | null>;
  dismissTemplate: (templateId: string) => void;
  deleteCurrent: () => Promise<void>;
  setCurrent: (entry: CBTEntry | null) => void;
  resetError: () => void;
}

function upsertEntry(entries: CBTEntry[], entry: CBTEntry): CBTEntry[] {
  const next = entries.filter((item) => item.id !== entry.id);
  return [entry, ...next];
}

function upsertPlan(plans: BehavioralActivity[], plan: BehavioralActivity): BehavioralActivity[] {
  return [plan, ...plans.filter((item) => item.id !== plan.id)];
}

export const useCheckInStore = create<CheckInStore>((set, get) => ({
  entries: [],
  plans: [],
  templates: [],
  current: null,
  draftId: null,
  assist: null,
  saveStatus: 'idle',
  loading: false,
  error: null,
  dismissedTemplateIds: [],
  excludedTemplateIds: [],
  usePreviousEntries: false,

  loadLanding: async () => {
    set({ loading: true, error: null });
    try {
      const [entries, plans] = await Promise.all([
        apiClient.listCheckIns(),
        apiClient.listActivityPlans(),
      ]);
      const draft = entries.find((entry) => entry.recordState === 'draft') ?? null;
      set({
        entries,
        plans,
        current: draft && get().current?.id === draft.id ? get().current : get().current,
        draftId: draft?.id ?? null,
        excludedTemplateIds: plans
          .filter((plan) => plan.usefulness === 'made_things_harder' && plan.templateId)
          .map((plan) => plan.templateId as string),
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Something didn’t load. Try again.',
        loading: false,
      });
    }
  },

  loadHistory: async (type?: string) => {
    set({ loading: true, error: null });
    try {
      const entries = await apiClient.listCheckIns(type ? { type } : undefined);
      set({ entries, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Something didn’t load. Try again.',
        loading: false,
      });
    }
  },

  loadPlans: async (checkInId?: string) => {
    try {
      const plans = await apiClient.listActivityPlans(checkInId);
      set({ plans });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Something didn’t load. Try again.',
      });
    }
  },

  loadTemplates: async () => {
    if (get().templates.length > 0) {
      return;
    }
    try {
      const templates = await apiClient.getActivityTemplates();
      set({ templates });
    } catch {
      set({ templates: [] });
    }
  },

  openEntry: async (id: string) => {
    try {
      const entry = await apiClient.getCheckIn(id);
      set({
        current: entry,
        draftId: entry.recordState === 'draft' ? entry.id : get().draftId,
        saveStatus: 'saved',
      });
      return entry;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Something didn’t load. Try again.' });
      return null;
    }
  },

  createDraft: async (request: CreateCBTEntryRequest) => {
    set({ saveStatus: 'saving', error: null });
    const zone = deviceTimezone();
    try {
      const entry = await apiClient.createCheckIn({
        ...zone,
        recordState: request.recordState ?? 'draft',
        ...request,
      });
      set((state) => ({
        current: entry,
        draftId: entry.recordState === 'draft' ? entry.id : state.draftId,
        entries: upsertEntry(state.entries, entry),
        saveStatus: 'saved',
      }));
      return entry;
    } catch (error) {
      set({
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Couldn’t save. You can try again.',
      });
      throw error;
    }
  },

  updateCurrent: async (request: UpdateCBTEntryRequest) => {
    const current = get().current;
    if (!current) {
      return null;
    }
    set({ saveStatus: 'saving', error: null });
    try {
      const entry = await apiClient.updateCheckIn(current.id, request);
      set((state) => ({
        current: entry,
        draftId: entry.recordState === 'draft' ? entry.id : state.draftId === entry.id ? null : state.draftId,
        entries: upsertEntry(state.entries, entry),
        saveStatus: 'saved',
      }));
      return entry;
    } catch (error) {
      set({
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Couldn’t save. You can try again.',
      });
      return null;
    }
  },

  saveAndClose: async () => {
    const current = get().current;
    if (!current) {
      return null;
    }
    return get().updateCurrent({ recordState: 'saved' });
  },

  chooseSupport: async (supportType: string) => {
    const current = get().current;
    if (!current) {
      return null;
    }
    const recordState = supportType === 'save' ? 'saved' : current.recordState ?? 'draft';
    return get().updateCurrent({ supportType, recordState });
  },

  requestAssist: async (request?: CheckInAssistRequest) => {
    const current = get().current;
    if (!current) {
      return null;
    }
    try {
      const assist = await apiClient.assistCheckIn(current.id, {
        usePreviousEntries: get().usePreviousEntries,
        dismissedTemplateIds: get().dismissedTemplateIds,
        excludedTemplateIds: get().excludedTemplateIds,
        ...request,
      });
      set({ assist });
      return assist;
    } catch (error) {
      set({
        assist: null,
        error: error instanceof Error ? error.message : 'Suggestions did not load. You can still save.',
      });
      return null;
    }
  },

  saveThought: async (request: UpdateCBTEntryRequest) => {
    const current = get().current;
    if (!current) {
      return null;
    }
    set({ saveStatus: 'saving' });
    try {
      const entry = await apiClient.saveThoughtRecord(current.id, request);
      set((state) => ({
        current: entry,
        entries: upsertEntry(state.entries, entry),
        saveStatus: 'saved',
      }));
      return entry;
    } catch (error) {
      set({
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Couldn’t save. You can try again.',
      });
      return null;
    }
  },

  saveProblem: async (record: ProblemSolvingRecord) => {
    const current = get().current;
    if (!current) {
      return null;
    }
    set({ saveStatus: 'saving' });
    try {
      const entry = await apiClient.saveProblemSolving(current.id, record);
      set((state) => ({
        current: entry,
        entries: upsertEntry(state.entries, entry),
        saveStatus: 'saved',
      }));
      return entry;
    } catch (error) {
      set({
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Couldn’t save. You can try again.',
      });
      return null;
    }
  },

  createPlan: async (request: CreateBehavioralActivityRequest) => {
    const plan = await apiClient.createActivityPlan({
      ...request,
      checkInId: request.checkInId ?? get().current?.id,
    });
    set((state) => ({ plans: upsertPlan(state.plans, plan) }));
    return plan;
  },

  updatePlan: async (id, request) => {
    try {
      const plan = await apiClient.updateActivityPlan(id, request);
      set((state) => ({ plans: upsertPlan(state.plans, plan) }));
      return plan;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Couldn’t save. You can try again.' });
      return null;
    }
  },

  recordAttempt: async (id, request) => {
    try {
      const plan = await apiClient.recordActivityAttempt(id, request);
      set((state) => ({
        plans: upsertPlan(state.plans, plan),
        excludedTemplateIds:
          plan.usefulness === 'made_things_harder' && plan.templateId
            ? Array.from(new Set([...state.excludedTemplateIds, plan.templateId]))
            : state.excludedTemplateIds,
      }));
      return plan;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Couldn’t save. You can try again.' });
      return null;
    }
  },

  linkTask: async (id) => {
    try {
      const result = await apiClient.linkActivityTask(id);
      set((state) => ({ plans: upsertPlan(state.plans, result.activity) }));
      return result.taskId;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Couldn’t add to tasks.' });
      return null;
    }
  },

  dismissTemplate: (templateId: string) => {
    set((state) => ({
      dismissedTemplateIds: Array.from(new Set([...state.dismissedTemplateIds, templateId])),
    }));
  },

  deleteCurrent: async () => {
    const current = get().current;
    if (!current) {
      return;
    }
    await apiClient.deleteCheckIn(current.id);
    set((state) => ({
      current: null,
      draftId: state.draftId === current.id ? null : state.draftId,
      entries: state.entries.filter((entry) => entry.id !== current.id),
    }));
  },

  setCurrent: (entry) => {
    set({
      current: entry,
      draftId: entry?.recordState === 'draft' ? entry.id : get().draftId,
    });
  },

  resetError: () => set({ error: null }),
}));

export function feelingFromCode(code: string, intensity?: number): FeelingRating {
  return {
    code,
    intensity,
    scaleMin: 0,
    scaleMax: 10,
    phase: 'before',
    measuredAtUtc: new Date().toISOString(),
  };
}
