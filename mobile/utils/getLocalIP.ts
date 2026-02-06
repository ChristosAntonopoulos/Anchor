// Utility to get local IP address for development
// This helps the mobile app connect to the backend running on your local machine

import { Platform } from 'react-native';

/**
 * Gets the local IP address from Expo's development server
 * Falls back to manual configuration if not available
 */
export function getLocalIP(): string {
  // Try to get IP from Expo constants (if available)
  try {
    const Constants = require('expo-constants');
    const manifest = Constants.manifest2 || Constants.manifest;
    
    // Expo Go provides the dev server IP
    if (manifest?.extra?.expoGo?.debuggerHost) {
      const host = manifest.extra.expoGo.debuggerHost.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
    
    // Try to get from Metro bundler
    if (manifest?.hostUri) {
      const host = manifest.hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch (error) {
    // Constants not available, continue to fallback
  }
  
  // Fallback: Return null to indicate manual configuration needed
  return '';
}

/**
 * Gets the API base URL for development
 * Uses local IP if available, otherwise returns null for manual configuration
 */
export function getDevApiBaseUrl(port: number = 5000): string | null {
  const ip = getLocalIP();
  if (ip) {
    return `http://${ip}:${port}/api`;
  }
  return null;
}

/**
 * Instructions for manual IP configuration
 */
export const IP_CONFIG_INSTRUCTIONS = `
To connect your mobile app to the backend running on your local machine:

1. Find your computer's IP address:
   - Windows: Open Command Prompt and run: ipconfig
   - Look for "IPv4 Address" under your active network adapter
   - Example: 192.168.1.100

2. Update mobile/constants/apiConfig.ts:
   - Replace 'localhost' with your IP address
   - Example: 'http://192.168.1.100:5000/api'

3. Ensure your phone and computer are on the same Wi-Fi network

4. Make sure Windows Firewall allows connections on port 5000
`;
