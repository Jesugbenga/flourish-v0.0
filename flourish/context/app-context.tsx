import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import type { UserProfile, SavingsWin, ChallengeDay, BudgetCategory } from '@/types';
import {
  userProfile as defaultProfile,
  recentWins as defaultWins,
  challengeDays as defaultChallenge,
  budgetCategories as defaultBudget,
} from '@/data/mock-data';
import { api, type WinPayload, type WinRow, type WinsSummary } from '@/lib/api';

// ─── Context Shape ─────────────────────────────────────────────────────

interface AppContextType {
  /** User profile (local mock or synced from backend) */
  user: UserProfile;
  /** Savings wins list */
  wins: SavingsWin[];
  /** 7-day challenge progress (mock-only for now) */
  challengeDays: ChallengeDay[];
  /** Budget categories (mock-only for now) */
  budget: BudgetCategory[];
  /** Monthly budget total */
  monthlyBudget: number;
  /** Liked community post IDs */
  likedPosts: Set<string>;
  /** Whether backend data is currently loading */
  loading: boolean;

  // ── Actions ──
  addWin: (win: SavingsWin) => void;
  completeChallenge: (day: number) => void;
  toggleLike: (postId: string) => void;
  updateBudget: (categoryId: string, spent: number) => void;
  setMonthlyBudget: (amount: number) => void;
  addCategory: (category: Omit<BudgetCategory, 'id'>) => void;
  deleteCategory: (categoryId: string) => void;

  // ── Backend syncing ──
  refreshProfile: () => Promise<void>;
  refreshWins: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Helpers ───────────────────────────────────────────────────────────

/** Convert a backend WinRow into the frontend SavingsWin shape */
function toSavingsWin(row: WinRow): SavingsWin {
  return {
    id: row.id,
    type: row.category as SavingsWin['type'],
    description: row.title,
    amount: row.amount_saved,
    date: row.created_at.split('T')[0],
  };
}

/** Build a UserProfile from a WinsSummary response */
function profileFromSummary(summary: WinsSummary, existing: UserProfile): UserProfile {
  return {
    ...existing,
    totalSavings: summary.totalSaved,
    swapSavings: summary.byCategory?.swap?.total ?? existing.swapSavings,
    mealSavings: summary.byCategory?.meal?.total ?? existing.mealSavings,
    budgetSavings: summary.byCategory?.budget?.total ?? existing.budgetSavings,
    challengeSavings: summary.byCategory?.challenge?.total ?? existing.challengeSavings,
    streak: summary.streakDays,
  };
}

// ─── Provider ──────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const initialUser: UserProfile = defaultProfile;
  const initialWins: SavingsWin[] = defaultWins;

  const [user, setUser] = useState<UserProfile>(initialUser);
  const [wins, setWins] = useState<SavingsWin[]>(initialWins);
  const [challengeState, setChallengeState] = useState<ChallengeDay[]>(defaultChallenge);
  const [budget, setBudget] = useState<BudgetCategory[]>(defaultBudget);
  /** Monthly budget: 0 until loaded from backend, then profile.profile.monthlyBudget ?? 0 */
  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  /** Current Firebase user id; used to reset state on sign-out and refetch on user change */
  const [authUserId, setAuthUserId] = useState<string | null>(() => firebaseAuth.currentUser?.uid ?? null);

  // ── Sync with auth: reset on sign-out, track uid for refetch on user change ──
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      if (u) {
        setAuthUserId(u.uid);
      } else {
        setAuthUserId(null);
        setUser(initialUser);
        setWins(initialWins);
        setChallengeState(defaultChallenge);
        setBudget(defaultBudget);
        setMonthlyBudgetState(0);
        setLikedPosts(new Set());
      }
    });
    return unsub;
  }, []);

  // ── Backend data fetchers ──

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      setUser((prev) => ({
        ...prev,
        name: profile.profile.displayName ?? prev.name,
        totalSavings: profile.user.totalSavings,
        streak: profile.user.streakDays,
      }));
      // Use backend as source of truth for monthly budget (null from backend → 0)
      setMonthlyBudgetState(profile.profile.monthlyBudget ?? 0);
      if ((profile.profile as any).budgetCategories !== undefined && Array.isArray(profile.profile.budgetCategories)) {
        setBudget(profile.profile.budgetCategories as BudgetCategory[]);
      }
    } catch {
      // Backend unreachable — keep mock data
    }
  }, []);

  const refreshWins = useCallback(async () => {
    try {
      setLoading(true);
      const [winsData, summary] = await Promise.all([
        api.getWins({ limit: 50 }),
        api.getWinsSummary(),
      ]);
      setWins(winsData.wins.map(toSavingsWin));
      setUser((prev) => profileFromSummary(summary, prev));
    } catch {
      // Offline — keep local state
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch profile + wins when a user is signed in (or when the signed-in user changes) ──
  useEffect(() => {
    if (!authUserId) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([refreshProfile(), refreshWins()]);
      setLoading(false);
    };
    init();
  }, [authUserId, refreshProfile, refreshWins]);

  // ── Actions ──

  const addWin = useCallback(
    (win: SavingsWin) => {
      // Optimistic local update
      setWins((prev) => [win, ...prev]);
      setUser((prev) => {
        const key = `${win.type}Savings` as keyof UserProfile;
        return {
          ...prev,
          totalSavings: prev.totalSavings + win.amount,
          [key]: (prev[key] as number) + win.amount,
        };
      });

      // Backend sync — attempt to persist and then refresh wins to ensure
      // totals are correct in the UI. This keeps optimistic updates snappy
      // but ensures eventual consistency with the backend.
      const payload: WinPayload = {
        title: win.description,
        amountSaved: win.amount,
        category: win.type,
      };
      (async () => {
        try {
          await api.logWin(payload);
          // Refresh wins/totals after the log succeeds
          await refreshWins();
        } catch {
          // ignore; optimistic UI remains
        }
      })();
    },
    [],
  );

  const completeChallenge = useCallback(
    async (day: number) => {
      setChallengeState((prev) => {
        const found = prev.find((d) => d.day === day);
        // If already completed, noop
        if (!found || found.completed) return prev;
        return prev.map((d) => (d.day === day ? { ...d, completed: true } : d));
      });

      // Find the userChallengeId (for now, assume challengeId = day)
      // TODO: If you have a real userChallengeId, use it here
      try {
        // Call backend to mark challenge complete
        // Replace 'day' with the actual userChallengeId if available
        await api.completeChallenge(String(day));

        // Add a win for this completed challenge day
        const found = challengeState.find((d) => d.day === day);
        if (found) {
          const amount = parseFloat(String(found.savingsEstimate).replace(/[^0-9.]/g, '')) || 0;
          const win = {
            id: Date.now().toString(),
            type: 'challenge' as const,
            description: `Day ${day}: ${found.title}`,
            amount,
            date: new Date().toISOString().split('T')[0],
          };
          addWin(win);
        }
      } catch (err) {
        // Optionally show error/toast
      }
    },
    [addWin, challengeState],
  );

  const toggleLike = useCallback((postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const updateBudget = useCallback((categoryId: string, spent: number) => {
    setBudget((prev) => prev.map((c) => (c.id === categoryId ? { ...c, spent } : c)));
  }, []);

  const setMonthlyBudget = useCallback((amount: number) => {
    setMonthlyBudgetState(Math.max(0, amount));
  }, []);

  const addCategory = useCallback((category: Omit<BudgetCategory, 'id'>) => {
    setBudget((prev) => {
      const next = [
        ...prev,
        {
          ...category,
          id: Date.now().toString(),
        },
      ];
      // Persist to backend (profiles doc)
      (async () => {
        try {
          await api.updateProfile({ budgetCategories: next });
        } catch {
          // ignore for now; could show a toast later
        }
      })();
      return next;
    });
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    setBudget((prev) => {
      const next = prev.filter((c) => c.id !== categoryId);
      (async () => {
        try {
          await api.updateProfile({ budgetCategories: next });
        } catch {}
      })();
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        wins,
        challengeDays: challengeState,
        budget,
        monthlyBudget,
        likedPosts,
        loading,
        addWin,
        completeChallenge,
        toggleLike,
        updateBudget,
        setMonthlyBudget,
        addCategory,
        deleteCategory,
        refreshProfile,
        refreshWins,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
