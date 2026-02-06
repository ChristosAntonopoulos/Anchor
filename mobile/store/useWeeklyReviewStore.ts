import { create } from 'zustand';
import type { WeeklyReview, SubmitWeeklyReviewRequest } from '../types';
import { apiClient } from '../services/api';

interface WeeklyReviewStore {
  data: WeeklyReview | null;
  loading: boolean;
  error: string | null;
  
  fetchWeeklyReview: () => Promise<void>;
  submitWeeklyReview: (request: SubmitWeeklyReviewRequest) => Promise<void>;
  reset: () => void;
}

export const useWeeklyReviewStore = create<WeeklyReviewStore>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchWeeklyReview: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiClient.getWeeklyReview();
      set({ data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load weekly review',
        loading: false 
      });
    }
  },

  submitWeeklyReview: async (request: SubmitWeeklyReviewRequest) => {
    set({ loading: true, error: null });
    try {
      await apiClient.submitWeeklyReview(request);
      await get().fetchWeeklyReview(); // Refresh data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to submit weekly review',
        loading: false 
      });
    }
  },

  reset: () => {
    set({ data: null, loading: false, error: null });
  },
}));
