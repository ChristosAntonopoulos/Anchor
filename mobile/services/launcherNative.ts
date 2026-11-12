import { NativeModules, Platform } from 'react-native';

type LauncherNative = {
  previewHome: () => Promise<boolean>;
  requestHomeRole: () => Promise<boolean>;
  openHomeSettings: () => Promise<boolean>;
  isDefaultHome: () => Promise<boolean>;
};

const native = NativeModules.LauncherModule as LauncherNative | undefined;

export const hasLauncherModule = Platform.OS === 'android' && !!native;

export async function previewHome(): Promise<void> {
  await native?.previewHome();
}

export async function useAsHome(): Promise<void> {
  await native?.requestHomeRole();
}

export async function openSystemHomeSettings(): Promise<void> {
  await native?.openHomeSettings();
}

export async function isDefaultHome(): Promise<boolean> {
  try {
    return Boolean(await native?.isDefaultHome());
  } catch {
    return false;
  }
}
