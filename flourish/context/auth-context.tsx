/**
 * ════════════════════════════════════════════
 *  Flourish — Auth Context
 * ════════════════════════════════════════════
 *  Wraps Firebase Auth + RevenueCat SDK.
 *  Premium status is determined entirely by
 *  RevenueCat entitlements (no webhook needed).
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { firebaseAuth } from '@/lib/firebase';
import { REVENUECAT_API_KEY, REVENUECAT_ANDROID_API_KEY, PREMIUM_ENTITLEMENT } from '@/lib/config';
import { api } from '@/lib/api';
import { useApp } from '@/context/app-context';

// ── Context Shape ───────────────────────────────────────────

interface AuthState {
  isReady: boolean;
  isSignedIn: boolean;
  hasPremium: boolean;
  userId: string | null;
  displayName: string | null;
  email: string | null;
  onboardingComplete: boolean;
  /** True after Purchases.configure() has run so paywall can call getOfferings() */
  isPurchasesConfigured: boolean;
  signOut: () => Promise<void>;
  refreshPremium: () => Promise<void>;
  setOnboardingComplete: (v: boolean) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/** Guard so we only configure RevenueCat once per app process (avoids duplicate call in React Strict Mode) */
let revenueCatConfiguredOnce = false;

// ── Provider ────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // Access app context methods to refresh profile and wins
  let refreshProfile: (() => Promise<void>) | undefined;
  let refreshWins: (() => Promise<void>) | undefined;
  try {
    // Only call inside a component render, not SSR
    ({ refreshProfile, refreshWins } = useApp());
  } catch {}
  const [isReady, setIsReady] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [isPurchasesConfigured, setIsPurchasesConfigured] = useState(false);
  const purchasesConfiguredRef = useRef(false);

  const isSignedIn = !!firebaseUser;
  const userId = firebaseUser?.uid ?? null;
  const displayName = firebaseUser?.displayName ?? null;
  const email = firebaseUser?.email ?? null;

  // ── Firebase auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      setAuthResolved(true);
    });
    return unsub;
  }, []);

  // ── Derive premium from RevenueCat CustomerInfo (no Firestore write) ──
  const checkPremium = useCallback((info: CustomerInfo) => {
    const active = info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
    setHasPremium(active);
  }, []);

  // ── RevenueCat: configure on app load so paywall can call getOfferings() ──
  useEffect(() => {
    const apiKey =
      Platform.OS === 'android'
        ? (REVENUECAT_ANDROID_API_KEY?.trim() || REVENUECAT_API_KEY?.trim())
        : REVENUECAT_API_KEY?.trim();
    if (!apiKey || purchasesConfiguredRef.current) {
      if (!apiKey) setIsPurchasesConfigured(false);
      return;
    }
    purchasesConfiguredRef.current = true;
    try {
      Purchases.configure({ apiKey });
      setIsPurchasesConfigured(true);
    } catch (e) {
      console.warn('[AuthContext] RevenueCat configure failed:', e);
      setIsPurchasesConfigured(false);
    }
  }, []);

  // ── RevenueCat: log in and sync premium when user signs in ──
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const init = async () => {
      try {
        await Purchases.logIn(userId);
        const info = await Purchases.getCustomerInfo();
        checkPremium(info);
      } catch {
        setHasPremium(false);
      }
    };
    init();

    const listener = (info: CustomerInfo) => checkPremium(info);
    try {
      Purchases.addCustomerInfoUpdateListener(listener);
    } catch (e) {
      console.warn('[AuthContext] Failed to add RevenueCat listener:', e);
    }
    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {}
    };
  }, [isSignedIn, userId, checkPremium]);

  // ── Backend init (creates Firestore user + fetches onboarding state) ──
  useEffect(() => {
    if (!authResolved) return;
    if (!isSignedIn || !email) {
      setIsReady(true);
      return;
    }

    // Keep showing loading until we have real onboarding status from backend;
    // otherwise InitGate would briefly send returning users to onboarding.
    setIsReady(false);

    // Safety timeout: if backend init takes too long (e.g. network issues),
    // set isReady=true after 8 seconds so the app doesn't hang on splash screen forever.
    const timeout = setTimeout(() => {
      setIsReady((prev) => {
        if (!prev) console.warn('[AuthContext] Backend init timed out — proceeding anyway');
        return true;
      });
    }, 8000);

    const initBackend = async () => {
      try {
        await api.initUser(email, displayName ?? undefined);
        const profile = await api.getProfile();
        setOnboardingComplete(profile.profile.onboardingComplete);
      } catch (err) {
        console.error('[AuthContext] Backend init failed:', err);
      } finally {
        clearTimeout(timeout);
        setIsReady(true);
      }
    };
    initBackend();

    return () => clearTimeout(timeout);
  }, [authResolved, isSignedIn, email, displayName, refreshProfile, refreshWins]);

  // ── Actions ──
  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
  }, []);

  const refreshPremium = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      checkPremium(info);
    } catch { /* ignore */ }
  }, [checkPremium]);

  return (
    <AuthContext.Provider
      value={{
        isReady,
        isSignedIn,
        hasPremium,
        userId,
        displayName,
        email,
        onboardingComplete,
        isPurchasesConfigured,
        signOut,
        refreshPremium,
        setOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────


export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}
