import { create } from 'zustand';
import type { TodayResponse, BetterItem, Task, DisciplineEntry, DietEntry } from '../types';
import { apiClient } from '../services/api';

interface TodayStore {
  // State
  data: TodayResponse | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchToday: () => Promise<void>;
  completeBetterItem: (id: string) => Promise<void>;
  acceptBetterItem: (id: string) => Promise<void>;
  editBetterItem: (id: string, title: string) => Promise<void>;
  rejectBetterItem: (id: string) => Promise<void>;
  createTask: (title: string, category: 'work' | 'leverage' | 'health' | 'stability') => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  updateDiscipline: (discipline: Partial<DisciplineEntry>) => Promise<void>;
  updateDiet: (diet: Partial<DietEntry>) => Promise<void>;
  reset: () => void;
}

export const useTodayStore = create<TodayStore>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchToday: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiClient.getToday();
      set({ data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load today data',
        loading: false 
      });
    }
  },

  completeBetterItem: async (id: string) => {
    try {
      await apiClient.completeBetterItem({ id });
      const currentData = get().data;
      if (currentData) {
        const item = currentData.betterItems.find(item => item.id === id);
        if (item) {
          item.completed = true;
          set({ data: { ...currentData } });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to complete item'
      });
    }
  },

  acceptBetterItem: async (id: string) => {
    try {
      await apiClient.acceptBetterItem({ id });
      const currentData = get().data;
      if (currentData) {
        const item = currentData.betterItems.find(item => item.id === id);
        if (item) {
          item.completed = true;
          set({ data: { ...currentData } });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to accept item'
      });
    }
  },

  editBetterItem: async (id: string, title: string) => {
    try {
      await apiClient.editBetterItem({ id, title });
      const currentData = get().data;
      if (currentData) {
        const item = currentData.betterItems.find(item => item.id === id);
        if (item) {
          item.title = title;
          set({ data: { ...currentData } });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to edit item'
      });
    }
  },

  rejectBetterItem: async (id: string) => {
    try {
      await apiClient.rejectBetterItem({ id });
      const currentData = get().data;
      if (currentData) {
        currentData.betterItems = currentData.betterItems.filter(item => item.id !== id);
        set({ data: { ...currentData } });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reject item'
      });
    }
  },

  createTask: async (title: string, category: 'work' | 'leverage' | 'health' | 'stability') => {
    try {
      await apiClient.createTask({ title, category });
      await get().fetchToday(); // Refresh data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task'
      });
    }
  },

  completeTask: async (id: string) => {
    try {
      await apiClient.completeTask({ id });
      const currentData = get().data;
      if (currentData) {
        const task = currentData.tasks.find(task => task.id === id);
        if (task) {
          task.completed = true;
          set({ data: { ...currentData } });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to complete task'
      });
    }
  },

  updateDiscipline: async (discipline: Partial<DisciplineEntry>) => {
    try {
      await apiClient.updateDiscipline({ discipline });
      const currentData = get().data;
      if (currentData) {
        currentData.discipline = { ...currentData.discipline, ...discipline };
        set({ data: { ...currentData } });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update discipline'
      });
    }
  },

  updateDiet: async (diet: Partial<DietEntry>) => {
    try {
      await apiClient.updateDiet({ diet });
      const currentData = get().data;
      if (currentData) {
        currentData.diet = { ...currentData.diet, ...diet };
        set({ data: { ...currentData } });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update diet'
      });
    }
  },

  reset: () => {
    set({ data: null, loading: false, error: null });
  },
}));
