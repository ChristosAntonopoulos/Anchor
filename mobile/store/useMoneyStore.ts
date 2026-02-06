import { create } from 'zustand';
import type { MoneySummary, CreateIncomeRequest } from '../types';
import { apiClient } from '../services/api';

interface MoneyStore {
  data: MoneySummary | null;
  loading: boolean;
  error: string | null;
  
  fetchMoneySummary: () => Promise<void>;
  createIncome: (request: CreateIncomeRequest) => Promise<void>;
  reset: () => void;
}

export const useMoneyStore = create<MoneyStore>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchMoneySummary: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiClient.getMoneySummary();
      set({ data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load money summary',
        loading: false 
      });
    }
  },

  createIncome: async (request: CreateIncomeRequest) => {
    try {
      await apiClient.createIncome(request);
      await get().fetchMoneySummary(); // Refresh data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create income entry'
      });
    }
  },

  reset: () => {
    set({ data: null, loading: false, error: null });
  },
}));
