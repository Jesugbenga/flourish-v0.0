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
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { firebaseAuth } from '@/lib/firebase';
import { REVENUECAT_API_KEY, PREMIUM_ENTITLEMENT } from '@/lib/config';
import { api } from '@/lib/api';
import { useApp } from '@/context/app-context';
import * as Updates from 'expo-updates';

// ── Context Shape ───────────────────────────────────────────

interface AuthState {
  isReady: boolean;
  isSignedIn: boolean;
  hasPremium: boolean;
  userId: string | null;
  displayName: string | null;
  email: string | null;
  onboardingComplete: boolean;
  signOut: () => Promise<void>;
  refreshPremium: () => Promise<void>;
  setOnboardingComplete: (v: boolean) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

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

  // ── RevenueCat setup + listener ──
  useEffect(() => {
    if (!REVENUECAT_API_KEY || !isSignedIn || !userId) return;
    if (purchasesConfiguredRef.current) return;
    purchasesConfiguredRef.current = true;

    const init = async () => {
      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        await Purchases.logIn(userId);
        const info = await Purchases.getCustomerInfo();
        checkPremium(info);
      } catch {
        setHasPremium(false);
      }
    };
    init();

    // Real-time listener — fires on purchase, renewal, cancellation
    const listener = (info: CustomerInfo) => checkPremium(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }, [isSignedIn, userId, checkPremium]);

  // ── Backend init (creates Firestore user + fetches onboarding state) ──
  useEffect(() => {
    if (!authResolved) return;
    if (!isSignedIn || !email) {
      setIsReady(true);
      return;
    }

    const initBackend = async () => {
      try {
        await api.initUser(email, displayName ?? undefined);
        const profile = await api.getProfile();
        setOnboardingComplete(profile.profile.onboardingComplete);
        // Full app reload to ensure all data is fresh
        if (Updates.reloadAsync) {
          await Updates.reloadAsync();
        }
      } catch (err) {
        console.error('[AuthContext] Backend init failed:', err);
      } finally {
        setIsReady(true);
      }
    };
    initBackend();
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
