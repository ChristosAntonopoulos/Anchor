import { create } from 'zustand';
import type { ScheduleBlock } from '../types';
import { apiClient } from '../services/api';

interface ScheduleStore {
  blocks: ScheduleBlock[];
  loading: boolean;
  error: string | null;

  fetchSchedule: () => Promise<void>;
  updateBlock: (id: string, updates: { title?: string; startTime?: string; endTime?: string }) => Promise<void>;
  completeChecklistItem: (blockId: string, itemId: string) => Promise<void>;
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
        loading: false,
      });
    }
  },

  updateBlock: async (id, updates) => {
    try {
      await apiClient.updateScheduleBlock({ id, ...updates });
      await get().fetchSchedule();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update schedule block',
      });
    }
  },

  completeChecklistItem: async (blockId, itemId) => {
    try {
      await apiClient.updateScheduleChecklistItem(blockId, itemId, true);
      set((state) => ({
        blocks: state.blocks.map((block) =>
          block.id !== blockId
            ? block
            : {
                ...block,
                checklistItems: block.checklistItems?.map((item) =>
                  item.id === itemId ? { ...item, completed: true } : item
                ),
              }
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update checklist',
      });
      throw error;
    }
  },

  reset: () => {
    set({ blocks: [], loading: false, error: null });
  },
}));
