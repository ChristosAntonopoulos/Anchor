import { NativeModules, Platform } from 'react-native';

type PhoneUnlockNative = {
  isKeyguardLocked?: () => Promise<boolean>;
};

const native = NativeModules.PhoneUnlockModule as PhoneUnlockNative | undefined;

/**
 * True when the Android keyguard is showing (screen lock).
 * Screen lock is NOT focus lock-in / immersive pin.
 */
export async function isKeyguardLocked(): Promise<boolean> {
  if (Platform.OS !== 'android' || !native?.isKeyguardLocked) return false;
  try {
    return Boolean(await native.isKeyguardLocked());
  } catch {
    return false;
  }
}
