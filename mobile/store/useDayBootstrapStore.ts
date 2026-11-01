import { create } from 'zustand';
import type { DayBootstrap } from '../types';

interface DayBootstrapStore {
  bootstrap: DayBootstrap | null;
  showAssessment: boolean;
  setBootstrap: (bootstrap: DayBootstrap) => void;
  setShowAssessment: (show: boolean) => void;
  reset: () => void;
}

export const useDayBootstrapStore = create<DayBootstrapStore>((set) => ({
  bootstrap: null,
  showAssessment: false,
  setBootstrap: (bootstrap) => set({ bootstrap }),
  setShowAssessment: (showAssessment) => set({ showAssessment }),
  reset: () => set({ bootstrap: null, showAssessment: false }),
}));
