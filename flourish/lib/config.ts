/**
 * ════════════════════════════════════════════
 *  Flourish — App Configuration
 * ════════════════════════════════════════════
 */

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

/** Backend API base URL (no trailing slash) — Firebase Cloud Functions */
export const API_URL: string =
  extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5001';

/** Google OAuth Client IDs (for expo-auth-session Google sign-in) */
export const FIREBASE_GOOGLE_WEB_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID ?? '';

export const FIREBASE_GOOGLE_IOS_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID ?? '';

export const FIREBASE_GOOGLE_ANDROID_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID ?? '';

/** RevenueCat public API key (Apple / Google) */
export const REVENUECAT_API_KEY: string =
  extra.revenuecatApiKey ??
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ??
  '';

/**
 * Mock mode: when true the app runs entirely off local mock data.
 * Turn this on for demos, offline dev, or before the backend is deployed.
 */
export const MOCK_MODE: boolean =
  (extra.mockMode ?? process.env.EXPO_PUBLIC_MOCK_MODE ?? 'true') === 'true';

/** RevenueCat premium entitlement ID */
export const PREMIUM_ENTITLEMENT = 'premium';
