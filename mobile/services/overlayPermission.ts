// Overlay Permission Service for Android
// Bridges native OverlayPermissionModule to React Native

import { NativeModules, Platform } from 'react-native';

const { OverlayPermissionModule } = NativeModules;

// Check if running on Android
const isAndroid = Platform.OS === 'android';

// Log module availability on load
console.log('[OverlayPermission] Platform:', Platform.OS);
console.log('[OverlayPermission] Native module available:', !!OverlayPermissionModule);
if (OverlayPermissionModule) {
  console.log('[OverlayPermission] Module name:', OverlayPermissionModule.getName?.() || 'Unknown');
  console.log('[OverlayPermission] Available methods:', Object.keys(OverlayPermissionModule));
}

export interface OverlayPermissionService {
  /**
   * Check if overlay permission is granted
   */
  isOverlayPermissionGranted(): Promise<boolean>;

  /**
   * Request overlay permission (opens Settings)
   */
  requestOverlayPermission(): Promise<boolean>;
}

class OverlayPermissionServiceImpl implements OverlayPermissionService {
  async isOverlayPermissionGranted(): Promise<boolean> {
    console.log('[OverlayPermission] isOverlayPermissionGranted() called');
    
    if (!isAndroid) {
      console.log('[OverlayPermission] Not Android platform, returning false');
      return false;
    }
    
    if (!OverlayPermissionModule) {
      console.warn('[OverlayPermission] OverlayPermissionModule is not available!');
      console.warn('[OverlayPermission] Make sure the native module is properly registered in MainApplication.kt');
      return false;
    }
    
    try {
      console.log('[OverlayPermission] Calling native isOverlayPermissionGranted()...');
      const result = await OverlayPermissionModule.isOverlayPermissionGranted();
      console.log('[OverlayPermission] Native check result:', result);
      return result;
    } catch (error: any) {
      console.error('[OverlayPermission] Error checking overlay permission:', error);
      console.error('[OverlayPermission] Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      return false;
    }
  }

  async requestOverlayPermission(): Promise<boolean> {
    console.log('[OverlayPermission] requestOverlayPermission() called');
    
    if (!isAndroid) {
      console.log('[OverlayPermission] Not Android platform, returning false');
      return false;
    }
    
    if (!OverlayPermissionModule) {
      console.warn('[OverlayPermission] OverlayPermissionModule is not available!');
      return false;
    }
    
    try {
      console.log('[OverlayPermission] Calling native requestOverlayPermission()...');
      const result = await OverlayPermissionModule.requestOverlayPermission();
      console.log('[OverlayPermission] Permission request result:', result);
      return result;
    } catch (error: any) {
      console.error('[OverlayPermission] Error requesting overlay permission:', error);
      return false;
    }
  }
}

export const overlayPermission: OverlayPermissionService = new OverlayPermissionServiceImpl();
