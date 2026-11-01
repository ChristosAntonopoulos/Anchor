// API configuration for backend connection
// Environment-aware base URL configuration

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Local POS.Api (dotnet run on POS.Api)
 * - iOS Simulator / web: localhost
 * - Android emulator: 10.0.2.2 (host machine)
 * - Physical device: set EXPO_PUBLIC_API_URL=http://<your-pc-ip>:5000/api
 */
function getDevApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
}

/**
 * Remote production NodePort (deployed cluster)
 */
const PROD_API_BASE_URL = 'http://185.193.66.50:31247/api';

const getApiBaseUrl = (): string => {
  // Dev builds (Expo Go, expo start, debug run) → local POS.Api
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return getDevApiBaseUrl();
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return PROD_API_BASE_URL;
};

const apiBaseUrl = getApiBaseUrl();

export const API_CONFIG = {
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

if (__DEV__) {
  console.log('🔗 API Base URL:', API_CONFIG.baseURL);
  console.log('🔗 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || '(not set)');
  console.log('🔗 Execution:', Constants.executionEnvironment);
} else {
  console.log('[API] Base URL:', API_CONFIG.baseURL);
}

export function getApiUrl(endpoint: string): string {
  const base = API_CONFIG.baseURL.endsWith('/')
    ? API_CONFIG.baseURL.slice(0, -1)
    : API_CONFIG.baseURL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

export function getApiBaseUrlForDebug(): string {
  return API_CONFIG.baseURL;
}
