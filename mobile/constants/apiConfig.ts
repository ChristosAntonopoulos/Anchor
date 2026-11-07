// API configuration — all URLs are driven by environment variables.
//
// Set EXPO_PUBLIC_DEV_API_URL in a local `.env` file (not committed) for
// physical device or emulator testing.  The production URL is set via
// EXPO_PUBLIC_API_URL in your CI / EAS build environment.
//
// Quick-start:
//   echo 'EXPO_PUBLIC_DEV_API_URL=http://192.168.x.x:5000/api' > mobile/.env
//
// Fallbacks below are safe defaults only; they should NOT be relied on in
// shared or CI environments.

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

const DEV_API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_API_URL ?? 'http://localhost:5000/api';

const PROD_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://185.193.66.50:35555/api';

export const API_CONFIG = {
  baseURL: isDev ? DEV_API_BASE_URL : PROD_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export function getApiUrl(endpoint: string): string {
  const base = API_CONFIG.baseURL.endsWith('/')
    ? API_CONFIG.baseURL.slice(0, -1)
    : API_CONFIG.baseURL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
