import { create } from 'zustand';
import {
  clearGuardHistory,
  disableGuardImmediately,
  ensureGuardMonitoring,
  getFrictionStats,
  getGuardSettings,
  getGuardStatus,
  getGuardUnlockEvents,
  getInstalledTargets,
  getRecentSegments,
  isDistractionGuardAvailable,
  openGuardOverlaySettings,
  openUsageAccessSettings,
  reconcileGuard,
  requestGuardNotificationPermission,
  resetGuardSettingsKeepHistory,
  saveGuardSettings,
  saveIntentionalUse,
  startGuardBypass,
  type GuardSettings,
  type GuardStatus,
  type InstalledTarget,
  type UnlockEvent,
  type UsageSegment,
} from 'distraction-guard';
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
  reconcileNow: () => void;
  updateSettings: (patch: Partial<GuardSettings>) => void;
  completeSetup: () => void;
  requestUsageAccess: () => void;
  requestOverlay: () => void;
  requestNotifications: () => void;
  bypass: (seconds: number) => void;
  endRestriction: () => void;
  disableAll: () => void;
  clearHistoryOnly: () => void;
  resetSettingsOnly: () => void;
  saveIntention: (payload: {
    purpose: string;
    durationSeconds: number;
    note?: string;
  }) => void;
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
      const status = getGuardStatus();
      const settings = getGuardSettings();
      const targets = getInstalledTargets();
      const segments = getRecentSegments(200);
      const unlocks = getGuardUnlockEvents(100);
      set({ status, settings, targets, segments, unlocks, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to refresh Distraction Guard',
      });
    }
  },

  reconcileNow: () => {
    if (!isDistractionGuardAvailable()) return;
    try {
      const status = reconcileGuard();
      const settings = getGuardSettings();
      set({
        status,
        settings,
        segments: getRecentSegments(200),
        unlocks: getGuardUnlockEvents(100),
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Reconcile failed',
      });
    }
  },

  updateSettings: (patch) => {
    saveGuardSettings(patch);
    get().refresh();
  },

  completeSetup: () => {
    requestGuardNotificationPermission();
    saveGuardSettings({ setupComplete: true, enabled: true });
    ensureGuardMonitoring();
    get().reconcileNow();
    get().refresh();
  },

  requestUsageAccess: () => openUsageAccessSettings(),
  requestOverlay: () => openGuardOverlaySettings(),
  requestNotifications: () => requestGuardNotificationPermission(),

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

  resetSettingsOnly: () => {
    resetGuardSettingsKeepHistory();
    get().refresh();
  },

  saveIntention: (payload) => {
    saveIntentionalUse(payload);
    get().refresh();
  },

  loadInsights: (days = 7) => {
    const segments = getRecentSegments(500);
    const unlocks = getGuardUnlockEvents(200);
    const settings = getGuardSettings();
    const status = getGuardStatus();
    const friction = getFrictionStats();
    const end = Date.now();
    const start = end - days * 24 * 60 * 60 * 1000;
    const insights = buildInsights({
      segments,
      unlocks,
      windowSeconds: settings?.unlockToDistractionWindowSeconds ?? 60,
      rangeStartMs: start,
      rangeEndMs: end,
      monitoringHealthy: !!status?.capabilities.usageAccessGranted,
      openingPresented: friction.presented,
      openingDismissed: friction.returned,
      analyzeUnlockPatterns: settings?.analyzeUnlockPatterns !== false,
      scheduleFilter: settings
        ? {
            startMinutes: settings.scheduleStartMinutes,
            endMinutes: settings.scheduleEndMinutes,
            activeDays: settings.activeDays,
          }
        : undefined,
    });
    set({ insights, segments, unlocks });
  },
}));
