import { create } from 'zustand';
import type { TodayResponse, BetterItem, Task, DisciplineEntry, DietEntry, UpdateTaskRequest, CreateTaskRequest, CategoryName } from '../types';
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
  createTask: (title: string, category: CategoryName) => Promise<void>;
  createTaskFull: (request: CreateTaskRequest) => Promise<void>;
  updateTask: (id: string, request: UpdateTaskRequest) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  getTasksNearby: (latitude: number, longitude: number, radiusKm?: number) => Promise<Task[]>;
  updateDiscipline: (request: { note?: string }) => Promise<void>;
  updateDiet: (diet: Partial<DietEntry>) => Promise<void>;
  submitAIInput: (text: string) => Promise<void>;
  reset: () => void;
}

export const useTodayStore = create<TodayStore>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchToday: async () => {
    set({ loading: true, error: null });
    try {
      console.log('📱 Fetching today data...');
      const data = await apiClient.getToday();
      console.log('✅ Today data received:', {
        hasDiscipline: !!data.discipline,
        discipline: data.discipline,
        hasDiet: !!data.diet,
        betterItemsCount: data.betterItems?.length || 0,
        tasksCount: data.tasks?.length || 0,
      });
      set({ data, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load today data';
      console.error('❌ Failed to fetch today data:', error);
      set({ 
        error: errorMessage,
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

  createTaskFull: async (request: CreateTaskRequest) => {
    try {
      await apiClient.createTask(request);
      await get().fetchToday(); // Refresh data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task'
      });
      throw error;
    }
  },

  updateTask: async (id: string, request: UpdateTaskRequest) => {
    try {
      await apiClient.updateTask(id, request);
      const currentData = get().data;
      if (currentData) {
        const task = currentData.tasks.find(t => t.id === id);
        if (task) {
          // Update task in place
          Object.assign(task, request);
          set({ data: { ...currentData } });
        }
      }
      // Also refresh to get latest from server
      await get().fetchToday();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task'
      });
      throw error;
    }
  },

  getTasksNearby: async (latitude: number, longitude: number, radiusKm: number = 5.0) => {
    try {
      return await apiClient.getTasksNearby(latitude, longitude, radiusKm);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get nearby tasks'
      });
      return [];
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

  updateDiscipline: async (request: { note?: string }) => {
    try {
      await apiClient.updateDiscipline(request);
      // Refresh data to get updated discipline entry
      await get().fetchToday();
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

  submitAIInput: async (text: string) => {
    try {
      await apiClient.submitAIInput(text);
      // Refresh data after a delay to see AI-processed results
      // The AI service will process this and create tasks/schedule blocks
      setTimeout(() => {
        get().fetchToday();
      }, 2000);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to submit input'
      });
      throw error; // Re-throw so component can handle it
    }
  },

  reset: () => {
    set({ data: null, loading: false, error: null });
  },
}));
