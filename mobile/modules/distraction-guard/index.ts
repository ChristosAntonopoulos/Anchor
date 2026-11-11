import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type GuardCapabilities = {
  usageAccessGranted: boolean;
  canObserveNativeApps: boolean;
  canObserveAppOpeningsLive: boolean;
  canObserveAppOpeningsReconciled?: boolean;
  canIdentifyBrowserDomains: boolean;
  canPresentImmediateIntervention: boolean;
  canRestrictNativeApps: boolean;
  canRestrictSelectedDomains: boolean;
  notificationsAllowed: boolean;
  overlayGranted?: boolean;
  monitoringHealth: string;
  lastSuccessfulObservationAt: number | null;
  knownLimitations: string[];
  protectionState?: string;
  browserDetectionStatus?: string;
  cycleStatus?: string;
  bypassActive?: boolean;
};

export type GuardSettings = {
  enabled: boolean;
  setupComplete: boolean;
  allowanceSeconds: number;
  cooldownSeconds: number;
  scheduleStartMinutes: number;
  scheduleEndMinutes: number;
  activeDays: number[];
  targetPackages: string[];
  targetHosts: string[];
  browserPackages?: string[];
  openingFrictionEnabled: boolean;
  openingPauseSeconds: number;
  maxFrictionPerHour: number;
  sessionDebounceSeconds: number;
  countdownWarningSeconds: number;
  unlockToDistractionWindowSeconds: number;
  treatWholeBrowserAsDistracting: boolean;
  intentionalUsesSharedAllowance: boolean;
  showNextAction?: boolean;
  quietNotifications?: boolean;
  rememberInterventions?: boolean;
  analyzeUnlockPatterns?: boolean;
  trackIntentionalSessions?: boolean;
  suggestWeeklyImprovement?: boolean;
  pausedUntilMs: number;
  version: number;
};

export type GuardCycle = {
  id: string;
  startedAtMs: number;
  observedUsageMs: number;
  allowanceMs: number;
  cooldownSeconds?: number;
  cycleStatus: string;
  cooldownStartedAtMs?: number;
  cooldownEndsAtMs?: number;
  thresholdCrossed?: boolean;
  exceptionType?: string;
  bypassExpiresAtMs?: number;
};

export type GuardStatus = {
  protectionState: string;
  cycle: GuardCycle | null;
  remainingAllowanceMs: number;
  remainingCooldownMs: number;
  provisionalUsageMs?: number;
  settings: GuardSettings;
  capabilities: GuardCapabilities;
  lastUpdatedAtMs: number;
  lastReconcileSucceeded?: boolean | null;
  addedUsageMs?: number;
  cooldownJustStarted?: boolean;
  bypassActive?: boolean;
};

export type InstalledTarget = {
  packageName: string;
  label: string;
  installed: boolean;
};

export type UsageSegment = {
  id: string;
  cycleId: string;
  packageName: string;
  startedAtMs: number;
  endedAtMs: number;
  durationMs: number;
  confidence: string;
  dedupeKey: string;
  observationSource?: string;
};

export type UnlockEvent = {
  id: string;
  timestampMs: number;
};

export type FrictionStats = {
  presented: number;
  returned: number;
};

type NativeModule = {
  getCapabilities(): GuardCapabilities;
  getStatus(): GuardStatus;
  reconcile(): GuardStatus;
  getSettings(): GuardSettings;
  saveSettings(settings: Partial<GuardSettings>): boolean;
  resetSettingsKeepHistory(): boolean;
  openUsageAccessSettings(): void;
  openOverlaySettings(): void;
  requestNotificationPermission(): void;
  getInstalledTargets(): InstalledTarget[];
  startBypass(durationSeconds: number, endRestriction: boolean): GuardCycle;
  saveIntentionalUse(payload: Record<string, unknown>): boolean;
  recordFrictionResult(result: string, packageName: string): boolean;
  getRecentUnlockEvents(limit: number): UnlockEvent[];
  disableImmediately(): boolean;
  clearHistory(): boolean;
  getRecentSegments(limit: number): UsageSegment[];
  getFrictionStats(): FrictionStats;
  ensureMonitoring(): boolean;
};

const unavailableCapabilities: GuardCapabilities = {
  usageAccessGranted: false,
  canObserveNativeApps: false,
  canObserveAppOpeningsLive: false,
  canIdentifyBrowserDomains: false,
  canPresentImmediateIntervention: false,
  canRestrictNativeApps: false,
  canRestrictSelectedDomains: false,
  notificationsAllowed: false,
  monitoringHealth: 'unavailable',
  lastSuccessfulObservationAt: null,
  knownLimitations: [
    'Distraction Guard native module unavailable (rebuild Android app; Expo Go unsupported)',
  ],
  protectionState: 'DISABLED',
  browserDetectionStatus: 'Monitoring unavailable.',
  cycleStatus: 'NONE',
};

let native: NativeModule | null | undefined;

function getNative(): NativeModule | null {
  if (native !== undefined) return native;
  if (Platform.OS !== 'android') {
    native = null;
    return null;
  }
  try {
    native = requireNativeModule('DistractionGuard') as NativeModule;
  } catch {
    native = null;
  }
  return native;
}

export function isDistractionGuardAvailable(): boolean {
  return getNative() != null;
}

export function getGuardCapabilities(): GuardCapabilities {
  return getNative()?.getCapabilities() ?? unavailableCapabilities;
}

export function getGuardStatus(): GuardStatus | null {
  return getNative()?.getStatus() ?? null;
}

export function reconcileGuard(): GuardStatus | null {
  return getNative()?.reconcile() ?? null;
}

export function getGuardSettings(): GuardSettings | null {
  return getNative()?.getSettings() ?? null;
}

export function saveGuardSettings(settings: Partial<GuardSettings>): boolean {
  return getNative()?.saveSettings(settings) ?? false;
}

export function resetGuardSettingsKeepHistory(): boolean {
  return getNative()?.resetSettingsKeepHistory() ?? false;
}

export function openUsageAccessSettings(): void {
  getNative()?.openUsageAccessSettings();
}

export function openGuardOverlaySettings(): void {
  getNative()?.openOverlaySettings();
}

export function requestGuardNotificationPermission(): void {
  getNative()?.requestNotificationPermission();
}

export function getInstalledTargets(): InstalledTarget[] {
  return getNative()?.getInstalledTargets() ?? [];
}

export function startGuardBypass(durationSeconds: number, endRestriction = false): GuardCycle | null {
  return getNative()?.startBypass(durationSeconds, endRestriction) ?? null;
}

export function saveIntentionalUse(payload: {
  purpose: string;
  durationSeconds: number;
  note?: string;
  packageName?: string;
}): boolean {
  return getNative()?.saveIntentionalUse(payload) ?? false;
}

export function getGuardUnlockEvents(limit = 50): UnlockEvent[] {
  return getNative()?.getRecentUnlockEvents(limit) ?? [];
}

export function disableGuardImmediately(): boolean {
  return getNative()?.disableImmediately() ?? false;
}

export function clearGuardHistory(): boolean {
  return getNative()?.clearHistory() ?? false;
}

export function getRecentSegments(limit = 100): UsageSegment[] {
  return getNative()?.getRecentSegments(limit) ?? [];
}

export function getFrictionStats(): FrictionStats {
  return getNative()?.getFrictionStats() ?? { presented: 0, returned: 0 };
}

export function ensureGuardMonitoring(): boolean {
  return getNative()?.ensureMonitoring() ?? false;
}
