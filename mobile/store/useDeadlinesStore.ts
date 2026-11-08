import { create } from 'zustand';
import type { CreateDeadlineRequest, Deadline, UpdateDeadlineRequest } from '../types';
import { apiClient } from '../services/api';

interface DeadlinesStore {
  deadlines: Deadline[];
  loading: boolean;
  error: string | null;

  fetchDeadlines: () => Promise<void>;
  createDeadline: (request: CreateDeadlineRequest) => Promise<void>;
  updateDeadline: (id: string, request: UpdateDeadlineRequest) => Promise<void>;
  deleteDeadline: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useDeadlinesStore = create<DeadlinesStore>((set, get) => ({
  deadlines: [],
  loading: false,
  error: null,

  fetchDeadlines: async () => {
    set({ loading: true, error: null });
    try {
      const deadlines = await apiClient.getDeadlines();
      set({ deadlines, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load deadlines',
        loading: false,
      });
    }
  },

  createDeadline: async (request) => {
    set({ error: null });
    try {
      await apiClient.createDeadline(request);
      await get().fetchDeadlines();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create deadline',
      });
      throw error;
    }
  },

  updateDeadline: async (id, request) => {
    set({ error: null });
    try {
      await apiClient.updateDeadline(id, request);
      await get().fetchDeadlines();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update deadline',
      });
      throw error;
    }
  },

  deleteDeadline: async (id) => {
    set({ error: null });
    try {
      await apiClient.deleteDeadline(id);
      await get().fetchDeadlines();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete deadline',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => {
    set({ deadlines: [], loading: false, error: null });
  },
}));
