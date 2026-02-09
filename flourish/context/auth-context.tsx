/**
 * ════════════════════════════════════════════
 *  Flourish — Auth Context
 * ════════════════════════════════════════════
 *  Wraps Firebase Auth + RevenueCat and exposes
 *  auth state to the entire app.
 *
 *  In MOCK_MODE, auth is bypassed and the user
 *  is treated as signed-in with premium access.
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
import { MOCK_MODE, REVENUECAT_API_KEY, PREMIUM_ENTITLEMENT } from '@/lib/config';
import { api } from '@/lib/api';

// ── Context Shape ───────────────────────────────────────────

interface AuthState {
  /** Whether the auth system has finished initialising */
  isReady: boolean;
  /** Firebase says the user is signed in (or mock mode) */
  isSignedIn: boolean;
  /** User has an active premium subscription */
  hasPremium: boolean;
  /** Firebase UID (or 'mock-user') */
  userId: string | null;
  /** Display name from Firebase */
  displayName: string | null;
  /** Email from Firebase */
  email: string | null;
  /** Whether onboarding is complete (set after init call) */
  onboardingComplete: boolean;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Force-refresh premium status from RevenueCat */
  refreshPremium: () => Promise<void>;
  /** Mark onboarding as done locally */
  setOnboardingComplete: (v: boolean) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(MOCK_MODE);
  const [hasPremium, setHasPremium] = useState(MOCK_MODE); // mock = premium
  const [onboardingComplete, setOnboardingComplete] = useState(MOCK_MODE);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(MOCK_MODE);
  const purchasesConfiguredRef = useRef(false);

  const isSignedIn = MOCK_MODE ? true : !!firebaseUser;
  const userId = MOCK_MODE ? 'mock-user' : (firebaseUser?.uid ?? null);
  const displayName = MOCK_MODE
    ? 'Rebecca'
    : (firebaseUser?.displayName ?? null);
  const email = MOCK_MODE
    ? 'rebecca@flourish.app'
    : (firebaseUser?.email ?? null);

  // ── Firebase auth state listener ──
  useEffect(() => {
    if (MOCK_MODE) return;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      setAuthResolved(true);
    });

    return unsubscribe;
  }, []);

  // ── RevenueCat setup ──
  useEffect(() => {
    if (MOCK_MODE) return;
    if (!REVENUECAT_API_KEY) return;
    if (!isSignedIn || !userId) return;

    // Only configure Purchases once
    if (purchasesConfiguredRef.current) return;
    purchasesConfiguredRef.current = true;

    const init = async () => {
      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        await Purchases.logIn(userId);
        const info: CustomerInfo = await Purchases.getCustomerInfo();
        setHasPremium(
          info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined,
        );
      } catch {
        // RevenueCat not configured — stay free
        setHasPremium(false);
      }
    };

    init();
  }, [isSignedIn, userId]);

  // ── Backend init call (creates user if needed) ──
  useEffect(() => {
    if (MOCK_MODE) {
      setIsReady(true);
      return;
    }

    // Auth state not resolved yet — wait
    if (!authResolved) return;

    // Not signed in → mark ready so InitGate can route to sign-in
    if (!isSignedIn || !email) {
      setIsReady(true);
      return;
    }

    const initBackend = async () => {
      try {
        await api.initUser(email, displayName ?? undefined);

        // Fetch profile to know onboarding state
        const profile = await api.getProfile();
        setOnboardingComplete(profile.profile.onboardingComplete);
        setHasPremium(profile.subscription.active);
      } catch (err) {
        console.error('[AuthContext] Backend init failed:', err);
        // Offline or backend not deployed — carry on
      } finally {
        setIsReady(true);
      }
    };

    initBackend();
  }, [authResolved, isSignedIn, email]);

  // ── Actions ──
  const signOut = useCallback(async () => {
    if (!MOCK_MODE) {
      await firebaseSignOut(firebaseAuth);
    }
  }, []);

  const refreshPremium = useCallback(async () => {
    if (MOCK_MODE) return;
    try {
      const info = await Purchases.getCustomerInfo();
      setHasPremium(
        info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined,
      );
    } catch {
      // ignore
    }
  }, []);

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
