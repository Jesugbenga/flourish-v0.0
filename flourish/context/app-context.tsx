import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserProfile, SavingsWin, ChallengeDay, BudgetCategory } from '@/types';
import {
  userProfile as defaultProfile,
  recentWins as defaultWins,
  challengeDays as defaultChallenge,
  budgetCategories as defaultBudget,
} from '@/data/mock-data';

// ─── Context Shape ─────────────────────────────────────────────────────

interface AppContextType {
  user: UserProfile;
  wins: SavingsWin[];
  challengeDays: ChallengeDay[];
  budget: BudgetCategory[];
  likedPosts: Set<string>;
  addWin: (win: SavingsWin) => void;
  completeChallenge: (day: number) => void;
  toggleLike: (postId: string) => void;
  updateBudget: (categoryId: string, spent: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultProfile);
  const [wins, setWins] = useState<SavingsWin[]>(defaultWins);
  const [challengeState, setChallengeState] = useState<ChallengeDay[]>(defaultChallenge);
  const [budget, setBudget] = useState<BudgetCategory[]>(defaultBudget);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const addWin = (win: SavingsWin) => {
    setWins((prev) => [win, ...prev]);
    setUser((prev) => {
      const key = `${win.type}Savings` as keyof UserProfile;
      return {
        ...prev,
        totalSavings: prev.totalSavings + win.amount,
        [key]: (prev[key] as number) + win.amount,
      };
    });
  };

  const completeChallenge = (day: number) => {
    setChallengeState((prev) => prev.map((d) => (d.day === day ? { ...d, completed: true } : d)));
  };

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const updateBudget = (categoryId: string, spent: number) => {
    setBudget((prev) => prev.map((c) => (c.id === categoryId ? { ...c, spent } : c)));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        wins,
        challengeDays: challengeState,
        budget,
        likedPosts,
        addWin,
        completeChallenge,
        toggleLike,
        updateBudget,
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
