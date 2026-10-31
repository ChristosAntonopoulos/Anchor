import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type UnlockPromptStatus = {
  enabled: boolean;
  overlayGranted: boolean;
  notificationsGranted: boolean;
  lastChoice: string | null;
  unavailable: boolean;
};

type NativeStatus = {
  enabled: boolean;
  overlayGranted: boolean;
  notificationsGranted: boolean;
  lastChoice: string;
};

type PhoneUnlockNative = {
  getStatus(): NativeStatus;
  setEnabled(enabled: boolean): boolean;
  ensureRunning(): void;
  openOverlaySettings(): void;
  requestNotificationPermission(): void;
};

const emptyStatus: UnlockPromptStatus = {
  enabled: false,
  overlayGranted: false,
  notificationsGranted: false,
  lastChoice: null,
  unavailable: true,
};

let native: PhoneUnlockNative | null | undefined;

function getNative(): PhoneUnlockNative | null {
  if (native !== undefined) {
    return native;
  }
  if (Platform.OS !== 'android') {
    native = null;
    return null;
  }
  try {
    native = requireNativeModule('PhoneUnlock') as PhoneUnlockNative;
  } catch {
    native = null;
  }
  return native;
}

function toStatus(raw: NativeStatus): UnlockPromptStatus {
  return {
    enabled: raw.enabled,
    overlayGranted: raw.overlayGranted,
    notificationsGranted: raw.notificationsGranted,
    lastChoice: raw.lastChoice || null,
    unavailable: false,
  };
}

export function getUnlockPromptStatus(): UnlockPromptStatus {
  const module = getNative();
  if (!module) {
    return emptyStatus;
  }
  return toStatus(module.getStatus());
}

export function setUnlockPromptEnabled(enabled: boolean): boolean {
  const module = getNative();
  if (!module) {
    return false;
  }
  return module.setEnabled(enabled);
}

export function ensureUnlockPromptRunning(): void {
  getNative()?.ensureRunning();
}

export function openOverlaySettings(): void {
  getNative()?.openOverlaySettings();
}

export function requestUnlockNotificationPermission(): void {
  getNative()?.requestNotificationPermission();
}
