// API configuration for backend connection
// Environment-aware base URL configuration

// Check if we're in development mode
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

/**
 * Development API Base URL Configuration
 * 
 * IMPORTANT: Update this URL based on your testing environment:
 * 
 * - iOS Simulator: Use 'http://localhost:5000/api' (works on simulator)
 * - Android Emulator: Use 'http://10.0.2.2:5000/api' (10.0.2.2 is special alias for host)
 * - Physical Device: Use your computer's IP address (e.g., 'http://192.168.1.43:5000/api')
 *   - Find your IP: Windows: `ipconfig` | Mac/Linux: `ifconfig` or `ip addr`
 *   - Both devices must be on the same Wi-Fi network
 * 
 * Backend runs on port 5000 (HTTP) - see backend/src/POS.Api/Properties/launchSettings.json
 */
const DEV_API_BASE_URL = 'http://192.168.1.43:5000/api';

/**
 * Production API Base URL Configuration
 * 
 * Production server: http://185.193.66.50:31247/api (NodePort)
 * 
 * For production builds (APK/IPA), EXPO_PUBLIC_API_URL is set during EAS build.
 * The fallback URL below is used if EXPO_PUBLIC_API_URL is not set.
 */
const PROD_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://185.193.66.50:31247/api';

// Priority: EXPO_PUBLIC_API_URL > Production URL > Development URL
const getApiBaseUrl = (): string => {
  // If EXPO_PUBLIC_API_URL is set, use it (highest priority)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // In development mode, use dev URL; otherwise use production
  return isDev ? DEV_API_BASE_URL : PROD_API_BASE_URL;
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper to get full URL for an endpoint
export function getApiUrl(endpoint: string): string {
  const base = API_CONFIG.baseURL.endsWith('/') 
    ? API_CONFIG.baseURL.slice(0, -1) 
    : API_CONFIG.baseURL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
