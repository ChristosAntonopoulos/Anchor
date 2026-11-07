import { create } from 'zustand';
import { apiClient } from '../services/api';
import { colors } from '../constants/designTokens';
import type { Category } from '../types';

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  getCategoryByName: (name: string) => Category | undefined;
  getCategoryColor: (name: string) => string;
  getCategoryGlow: (name: string) => string;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categories = await apiClient.getCategories();
      set({ categories, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
      set({ error: errorMessage, loading: false });
    }
  },

  getCategoryByName: (name: string) => {
    return get().categories.find(c => c.name === name);
  },

  getCategoryColor: (_name: string) => colors.textSecondary,

  getCategoryGlow: (_name: string) => 'transparent',
}));
