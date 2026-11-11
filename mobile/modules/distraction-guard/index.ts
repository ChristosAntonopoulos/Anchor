import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type GuardCapabilities = {
  usageAccessGranted: boolean;
  canObserveNativeApps: boolean;
  canObserveAppOpeningsLive: boolean;
  canIdentifyBrowserDomains: boolean;
  canPresentImmediateIntervention: boolean;
  canRestrictNativeApps: boolean;
  canRestrictSelectedDomains: boolean;
  notificationsAllowed: boolean;
  monitoringHealth: string;
  lastSuccessfulObservationAt: number | null;
  knownLimitations: string[];
  protectionState?: string;
  browserDetectionStatus?: string;
  cycleStatus?: string;
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
  openingFrictionEnabled: boolean;
  openingPauseSeconds: number;
  maxFrictionPerHour: number;
  sessionDebounceSeconds: number;
  countdownWarningSeconds: number;
  unlockToDistractionWindowSeconds: number;
  treatWholeBrowserAsDistracting: boolean;
  intentionalUsesSharedAllowance: boolean;
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
  settings: GuardSettings;
  capabilities: GuardCapabilities;
  lastUpdatedAtMs: number;
  addedUsageMs?: number;
  cooldownJustStarted?: boolean;
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

type NativeModule = {
  getCapabilities(): GuardCapabilities;
  getStatus(): GuardStatus;
  reconcile(): GuardStatus;
  getSettings(): GuardSettings;
  saveSettings(settings: Partial<GuardSettings>): boolean;
  openUsageAccessSettings(): void;
  openOverlaySettings(): void;
  getInstalledTargets(): InstalledTarget[];
  startBypass(durationSeconds: number, endRestriction: boolean): GuardCycle;
  disableImmediately(): boolean;
  clearHistory(): boolean;
  getRecentSegments(limit: number): UsageSegment[];
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
  knownLimitations: ['Distraction Guard native module unavailable (rebuild Android app; Expo Go unsupported)'],
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
  const module = getNative();
  if (!module) return null;
  return module.getStatus();
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

export function openUsageAccessSettings(): void {
  getNative()?.openUsageAccessSettings();
}

export function openGuardOverlaySettings(): void {
  getNative()?.openOverlaySettings();
}

export function getInstalledTargets(): InstalledTarget[] {
  return getNative()?.getInstalledTargets() ?? [];
}

export function startGuardBypass(durationSeconds: number, endRestriction = false): GuardCycle | null {
  return getNative()?.startBypass(durationSeconds, endRestriction) ?? null;
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

export function ensureGuardMonitoring(): boolean {
  return getNative()?.ensureMonitoring() ?? false;
}
