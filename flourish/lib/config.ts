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

/** Mock mode removed — app runs in production mode. */
export const MOCK_MODE = false;

/** RevenueCat premium entitlement ID — matches the entitlement created in RevenueCat dashboard */
export const PREMIUM_ENTITLEMENT = 'Flourish Pro';
