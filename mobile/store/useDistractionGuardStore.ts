import { create } from 'zustand';
import {
  clearGuardHistory,
  disableGuardImmediately,
  ensureGuardMonitoring,
  getGuardSettings,
  getGuardStatus,
  getInstalledTargets,
  getRecentSegments,
  isDistractionGuardAvailable,
  openUsageAccessSettings,
  reconcileGuard,
  saveGuardSettings,
  startGuardBypass,
  type GuardSettings,
  type GuardStatus,
  type InstalledTarget,
  type UsageSegment,
} from 'distraction-guard';
import { getRecentUnlockEvents, type UnlockEvent } from 'phone-unlock';
import { buildInsights, type InsightsSummary } from '../features/distraction-guard/insights';

type GuardStore = {
  available: boolean;
  status: GuardStatus | null;
  settings: GuardSettings | null;
  targets: InstalledTarget[];
  segments: UsageSegment[];
  unlocks: UnlockEvent[];
  insights: InsightsSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateSettings: (patch: Partial<GuardSettings>) => void;
  completeSetup: () => void;
  requestUsageAccess: () => void;
  bypass: (seconds: number) => void;
  endRestriction: () => void;
  disableAll: () => void;
  clearHistoryOnly: () => void;
  loadInsights: (days?: number) => void;
};

export const useDistractionGuardStore = create<GuardStore>((set, get) => ({
  available: isDistractionGuardAvailable(),
  status: null,
  settings: null,
  targets: [],
  segments: [],
  unlocks: [],
  insights: null,
  loading: false,
  error: null,

  refresh: () => {
    const available = isDistractionGuardAvailable();
    if (!available) {
      set({
        available: false,
        status: null,
        settings: null,
        error: 'Rebuild the Android app to enable Distraction Guard. Expo Go is unsupported.',
      });
      return;
    }
    set({ loading: true, error: null, available: true });
    try {
      ensureGuardMonitoring();
      const status = reconcileGuard() ?? getGuardStatus();
      const settings = getGuardSettings();
      const targets = getInstalledTargets();
      const segments = getRecentSegments(200);
      const unlocks = getRecentUnlockEvents(100);
      set({ status, settings, targets, segments, unlocks, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to refresh Distraction Guard',
      });
    }
  },

  updateSettings: (patch) => {
    saveGuardSettings(patch);
    get().refresh();
  },

  completeSetup: () => {
    saveGuardSettings({ setupComplete: true, enabled: true });
    ensureGuardMonitoring();
    get().refresh();
  },

  requestUsageAccess: () => {
    openUsageAccessSettings();
  },

  bypass: (seconds) => {
    startGuardBypass(seconds, false);
    get().refresh();
  },

  endRestriction: () => {
    startGuardBypass(0, true);
    get().refresh();
  },

  disableAll: () => {
    disableGuardImmediately();
    get().refresh();
  },

  clearHistoryOnly: () => {
    clearGuardHistory();
    get().refresh();
    get().loadInsights(7);
  },

  loadInsights: (days = 7) => {
    const segments = getRecentSegments(500);
    const unlocks = getRecentUnlockEvents(200);
    const settings = getGuardSettings();
    const status = getGuardStatus();
    const end = Date.now();
    const start = end - days * 24 * 60 * 60 * 1000;
    const insights = buildInsights({
      segments,
      unlocks,
      windowSeconds: settings?.unlockToDistractionWindowSeconds ?? 60,
      rangeStartMs: start,
      rangeEndMs: end,
      monitoringHealthy: !!status?.capabilities.usageAccessGranted,
    });
    set({ insights, segments, unlocks });
  },
}));
