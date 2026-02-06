import { create } from 'zustand';
import type { Deadline } from '../types';
import { apiClient } from '../services/api';

interface DeadlinesStore {
  deadlines: Deadline[];
  loading: boolean;
  error: string | null;
  
  fetchDeadlines: () => Promise<void>;
  reset: () => void;
}

export const useDeadlinesStore = create<DeadlinesStore>((set) => ({
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
        loading: false 
      });
    }
  },

  reset: () => {
    set({ deadlines: [], loading: false, error: null });
  },
}));
