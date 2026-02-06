import { create } from 'zustand';
import type { ScheduleBlock } from '../types';
import { apiClient } from '../services/api';

interface ScheduleStore {
  blocks: ScheduleBlock[];
  loading: boolean;
  error: string | null;
  
  fetchSchedule: () => Promise<void>;
  updateBlock: (id: string, updates: { title?: string; startTime?: string; endTime?: string }) => Promise<void>;
  reset: () => void;
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  blocks: [],
  loading: false,
  error: null,

  fetchSchedule: async () => {
    set({ loading: true, error: null });
    try {
      const blocks = await apiClient.getSchedule();
      set({ blocks, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load schedule',
        loading: false 
      });
    }
  },

  updateBlock: async (id: string, updates: { title?: string; startTime?: string; endTime?: string }) => {
    try {
      await apiClient.updateScheduleBlock({ id, ...updates });
      const currentBlocks = get().blocks;
      const updatedBlocks = currentBlocks.map(block =>
        block.id === id ? { ...block, ...updates } : block
      );
      set({ blocks: updatedBlocks });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update schedule block'
      });
    }
  },

  reset: () => {
    set({ blocks: [], loading: false, error: null });
  },
}));
