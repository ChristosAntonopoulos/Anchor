import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

type MorningNative = {
  getGate: () => Promise<{
    pending?: boolean;
    pinEnabled?: boolean;
    overlayGranted?: boolean;
    localDate?: string;
    timezone?: string;
    status?: string;
  }>;
  consumePending: () => Promise<boolean>;
  getSessionJson: () => Promise<string | null>;
  saveSessionJson: (json: string | null) => Promise<boolean>;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  playChime: () => void;
  setPinEnabled: (enabled: boolean) => Promise<boolean>;
  enterImmersive: () => Promise<boolean>;
  exitImmersive: () => Promise<boolean>;
  startPin: () => Promise<boolean>;
  stopPin: () => Promise<boolean>;
  capabilities: () => Promise<{
    userPresentReceiver?: boolean;
    overlayPermission?: boolean;
    fullScreenNotification?: boolean;
    deviceOwnerLockTask?: boolean;
    accessibilityUsed?: boolean;
    screenPinningOptional?: boolean;
  }>;
  addListener?: (event: string) => void;
  removeListeners?: (count: number) => void;
};

const native = NativeModules.MorningModeModule as MorningNative | undefined;
const available = Platform.OS === 'android' && !!native;
const emitter = available ? new NativeEventEmitter(NativeModules.MorningModeModule) : null;

export const hasMorningModeModule = available;

export function subscribeMorningNative(onOpen: () => void): () => void {
  if (!emitter) return () => undefined;
  const sub = emitter.addListener('onMorningMode', () => onOpen());
  return () => sub.remove();
}

export async function getMorningGate() {
  if (!native?.getGate) return { pending: false, status: undefined as string | undefined };
  try {
    return await native.getGate();
  } catch {
    return { pending: false, status: undefined as string | undefined };
  }
}

export async function consumeMorningPending(): Promise<boolean> {
  if (!native?.consumePending) return false;
  try {
    return Boolean(await native.consumePending());
  } catch {
    return false;
  }
}

export async function loadNativeSessionJson(): Promise<string | null> {
  if (!native?.getSessionJson) return null;
  try {
    return (await native.getSessionJson()) ?? null;
  } catch {
    return null;
  }
}

export async function saveNativeSessionJson(json: string | null): Promise<void> {
  if (!native?.saveSessionJson) return;
  try {
    await native.saveSessionJson(json);
  } catch {
    // local cache only
  }
}

export function speakMorning(text: string): void {
  try {
    native?.speak(text);
  } catch {
    // TTS is optional
  }
}

export function stopMorningSpeech(): void {
  try {
    native?.stopSpeaking();
  } catch {
    // ignore
  }
}

export function playMorningChime(): void {
  try {
    native?.playChime();
  } catch {
    // ignore
  }
}

export async function setMorningPinEnabled(enabled: boolean): Promise<void> {
  try {
    await native?.setPinEnabled(enabled);
  } catch {
    // optional
  }
}

export async function enterMorningImmersive(): Promise<void> {
  try {
    await native?.enterImmersive();
  } catch {
    // optional
  }
}

export async function exitMorningImmersive(): Promise<void> {
  try {
    await native?.exitImmersive();
    await native?.stopPin();
  } catch {
    // optional
  }
}

export async function startMorningPin(): Promise<boolean> {
  try {
    return Boolean(await native?.startPin());
  } catch {
    return false;
  }
}

export async function morningCapabilities() {
  try {
    return (
      (await native?.capabilities()) ?? {
        userPresentReceiver: false,
        overlayPermission: false,
        fullScreenNotification: false,
        deviceOwnerLockTask: false,
        accessibilityUsed: false,
        screenPinningOptional: false,
      }
    );
  } catch {
    return {
      userPresentReceiver: false,
      overlayPermission: false,
      fullScreenNotification: false,
      deviceOwnerLockTask: false,
      accessibilityUsed: false,
      screenPinningOptional: false,
    };
  }
}
