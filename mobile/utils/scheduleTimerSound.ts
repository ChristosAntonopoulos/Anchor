import { Platform, Vibration } from 'react-native';

/** Brief vibration when a checklist step completes. */
export async function playBlockTransitionSound(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(200);
    }
  } catch {
    // optional on emulator
  }
}
