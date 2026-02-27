// API configuration for backend connection
// Environment-aware base URL configuration

// Check if we're in development mode
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

/**
 * Development API Base URL Configuration
 * 
 * IMPORTANT: Update this URL based on your testing environment:
 * 
 * - iOS Simulator: Use 'http://localhost:5000/api' or 'https://localhost:7246/api' (works on simulator)
 * - Android Emulator: Use 'http://10.0.2.2:5000/api' (10.0.2.2 is special alias for host)
 *   - Using HTTP (port 5000) to avoid SSL certificate issues with self-signed certs
 *   - Backend is bound to 0.0.0.0:5000 - accessible from emulator
 * - Physical Device: Use your computer's IP address (e.g., 'http://192.168.1.43:5000/api')
 *   - Find your IP: Windows: `ipconfig` | Mac/Linux: `ifconfig` or `ip addr`
 *   - Both devices must be on the same Wi-Fi network
 * 
 * Backend runs on:
 *   - HTTP: port 5000 (bound to 0.0.0.0:5000 - accessible from emulator, no SSL issues)
 *   - HTTPS: port 7246 (bound to 0.0.0.0:7246 - has SSL certificate issues in emulator)
 * 
 * DEFAULT: Uses Android emulator address with HTTP (10.0.2.2:5000) - avoids SSL certificate problems
 * 
 * CURRENT SETTING: Using physical device IP (192.168.1.43) for testing on real device
 */
const DEV_API_BASE_URL = 'http://192.168.1.43:5000/api';

/**
 * Production API Base URL Configuration
 * 
 * Production server: http://185.193.66.50:31247/api (NodePort)
 * 
 * For production builds (APK/IPA), EXPO_PUBLIC_API_URL is set during EAS build.
 * The fallback URL below is used if EXPO_PUBLIC_API_URL is not set.
 * 
 * Used only in production builds (not in development mode).
 */
const PROD_API_BASE_URL = 'http://185.193.66.50:31247/api';

// Priority: EXPO_PUBLIC_API_URL > Dev URL (in dev mode) > Production URL (in production)
const getApiBaseUrl = (): string => {
  // If EXPO_PUBLIC_API_URL is set, use it (highest priority)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // In development mode, use local backend (works with Android emulator via 10.0.2.2)
  if (isDev) {
    return DEV_API_BASE_URL;
  }
  
  // In production builds, use production server
  return PROD_API_BASE_URL;
};

const apiBaseUrl = getApiBaseUrl();

export const API_CONFIG = {
  baseURL: apiBaseUrl,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Log API URL on initialization (helps verify correct URL in production builds)
if (__DEV__) {
  console.log('🔗 API Base URL:', API_CONFIG.baseURL);
  console.log('🔗 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || '(not set)');
}

// Helper to get full URL for an endpoint
export function getApiUrl(endpoint: string): string {
  const base = API_CONFIG.baseURL.endsWith('/') 
    ? API_CONFIG.baseURL.slice(0, -1) 
    : API_CONFIG.baseURL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

// Export for debugging
export function getApiBaseUrlForDebug(): string {
  return API_CONFIG.baseURL;
}
