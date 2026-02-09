import { create } from 'zustand';
import { apiClient } from '../services/api';
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

  getCategoryColor: (name: string) => {
    const category = get().getCategoryByName(name);
    if (category) {
      return category.color;
    }
    // Fallback to hardcoded colors during migration
    const fallbackColors: Record<string, string> = {
      work: '#00D9FF',
      leverage: '#10D9A0',
      health: '#FFB84D',
      stability: '#A78BFA',
    };
    return fallbackColors[name] || '#8B95A6';
  },

  getCategoryGlow: (name: string) => {
    const category = get().getCategoryByName(name);
    if (category) {
      // Convert hex color to rgba with 25% opacity
      const hex = category.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.25)`;
    }
    // Fallback to hardcoded glows during migration
    const fallbackGlows: Record<string, string> = {
      work: '#00D9FF40',
      leverage: '#10D9A040',
      health: '#FFB84D40',
      stability: '#A78BFA40',
    };
    return fallbackGlows[name] || 'rgba(167, 139, 250, 0.2)';
  },
}));
