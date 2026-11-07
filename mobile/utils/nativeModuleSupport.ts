import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/** True when running inside the Expo Go app (no custom native code). */
export const isExpoGo = Constants.executionEnvironment === 'storeClient';

export const hasPhoneUnlockModule =
  Platform.OS === 'android' && !!NativeModules.PhoneUnlockModule;

export const hasNotificationListenerModule =
  Platform.OS === 'android' && !!NativeModules.NotificationListenerModule;

/** Custom modules ship only in dev/production builds (`expo run:android`), not Expo Go. */
export const supportsCustomNativeModules =
  hasPhoneUnlockModule || hasNotificationListenerModule;

export function getNativeModuleUnavailableMessage(): string {
  if (isExpoGo) {
    return 'Requires a development build (expo run:android). Not available in Expo Go.';
  }
  return 'Native module not found. Rebuild with: npx expo run:android';
}
