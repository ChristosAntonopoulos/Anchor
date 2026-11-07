import { create } from 'zustand';
import { apiClient } from '../services/api';
import type {
  CBTEntry,
  MoodEntry,
  BehavioralActivity,
  CreateMoodEntryRequest,
  CreateBehavioralActivityRequest,
  UpdateBehavioralActivityRequest,
  CompleteBehavioralActivityRequest,
} from '../types';

interface CBTStore {
  // State
  entries: CBTEntry[];
  moodEntries: MoodEntry[];
  activities: BehavioralActivity[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchCBTEntries: (date?: string) => Promise<void>;
  submitCBTEntry: (text: string) => Promise<CBTEntry>;
  fetchMoodEntries: (startDate: string, endDate: string) => Promise<void>;
  createMoodEntry: (request: CreateMoodEntryRequest) => Promise<void>;
  fetchBehavioralActivities: (date?: string) => Promise<void>;
  createBehavioralActivity: (request: CreateBehavioralActivityRequest) => Promise<void>;
  updateBehavioralActivity: (id: string, request: UpdateBehavioralActivityRequest) => Promise<void>;
  completeActivity: (id: string, request: CompleteBehavioralActivityRequest) => Promise<void>;
  reset: () => void;
}

export const useCBTStore = create<CBTStore>((set, get) => ({
  entries: [],
  moodEntries: [],
  activities: [],
  loading: false,
  error: null,

  fetchCBTEntries: async (date?: string) => {
    set({ loading: true, error: null });
    try {
      const entries = await apiClient.getCBTEntries(date);
      set({ entries, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load CBT entries';
      set({ error: errorMessage, loading: false });
    }
  },

  submitCBTEntry: async (text: string) => {
    set({ loading: true, error: null });
    try {
      const entry = await apiClient.submitCBTEntry(text);
      set((state) => ({
        entries: [entry, ...state.entries],
        loading: false,
      }));
      return entry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit CBT entry';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchMoodEntries: async (startDate: string, endDate: string) => {
    set({ loading: true, error: null });
    try {
      const entries = await apiClient.getMoodEntries(startDate, endDate);
      set({ moodEntries: entries, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load mood entries';
      set({ error: errorMessage, loading: false });
    }
  },

  createMoodEntry: async (request: CreateMoodEntryRequest) => {
    set({ loading: true, error: null });
    try {
      await apiClient.createMoodEntry(request);
      // Refresh mood entries
      await get().fetchMoodEntries(request.date, request.date);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create mood entry';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchBehavioralActivities: async (date?: string) => {
    set({ loading: true, error: null });
    try {
      const activities = await apiClient.getBehavioralActivities(date);
      set({ activities, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load behavioral activities';
      set({ error: errorMessage, loading: false });
    }
  },

  createBehavioralActivity: async (request: CreateBehavioralActivityRequest) => {
    set({ loading: true, error: null });
    try {
      await apiClient.createBehavioralActivity(request);
      // Refresh activities
      await get().fetchBehavioralActivities();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create behavioral activity';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateBehavioralActivity: async (id: string, request: UpdateBehavioralActivityRequest) => {
    set({ loading: true, error: null });
    try {
      await apiClient.updateBehavioralActivity(id, request);
      // Refresh activities
      await get().fetchBehavioralActivities();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update behavioral activity';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  completeActivity: async (id: string, request: CompleteBehavioralActivityRequest) => {
    set({ loading: true, error: null });
    try {
      await apiClient.completeBehavioralActivity(id, request);
      // Refresh activities
      await get().fetchBehavioralActivities();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete activity';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  reset: () => {
    set({
      entries: [],
      moodEntries: [],
      activities: [],
      loading: false,
      error: null,
    });
  },
}));
