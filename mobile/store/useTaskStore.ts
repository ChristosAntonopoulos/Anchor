import { create } from 'zustand';
import type {
  Task,
  CategoryName,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types';
import { MAX_TODAY_FOCUS } from '../types';
import { apiClient } from '../services/api';

interface TaskStore {
  todayFocus: Task[];
  inboxItems: Task[];
  inboxTotalCount: number;
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  createTask: (title: string, category: CategoryName, status: 'inbox' | 'today') => Promise<void>;
  createTaskFull: (request: CreateTaskRequest) => Promise<void>;
  updateTask: (id: string, request: UpdateTaskRequest) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  promoteTask: (id: string) => Promise<void>;
  demoteTask: (id: string) => Promise<void>;
  reset: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  todayFocus: [],
  inboxItems: [],
  inboxTotalCount: 0,
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const [todayFocus, inbox] = await Promise.all([
        apiClient.getTodayFocus(),
        apiClient.getInbox(),
      ]);
      set({
        todayFocus,
        inboxItems: inbox.items,
        inboxTotalCount: inbox.totalCount,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load tasks',
        loading: false,
      });
    }
  },

  createTask: async (title, category, status) => {
    try {
      await apiClient.createTask({ title, category, status });
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create task' });
      throw error;
    }
  },

  createTaskFull: async (request) => {
    try {
      await apiClient.createTask(request);
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create task' });
      throw error;
    }
  },

  updateTask: async (id, request) => {
    try {
      await apiClient.updateTask(id, request);
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
      throw error;
    }
  },

  completeTask: async (id) => {
    try {
      await apiClient.completeTask({ id });
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to complete task' });
    }
  },

  promoteTask: async (id) => {
    try {
      await apiClient.promoteTask(id);
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to promote task' });
      throw error;
    }
  },

  demoteTask: async (id) => {
    try {
      await apiClient.demoteTask(id);
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to demote task' });
      throw error;
    }
  },

  reset: () => {
    set({
      todayFocus: [],
      inboxItems: [],
      inboxTotalCount: 0,
      loading: false,
      error: null,
    });
  },
}));

export function canAddToTodayFocus(todayCount: number): boolean {
  return todayCount < MAX_TODAY_FOCUS;
}
