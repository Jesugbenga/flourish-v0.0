/**
 * ════════════════════════════════════════════
 *  Flourish — API Client
 * ════════════════════════════════════════════
 *  Typed fetch wrapper that attaches the Firebase
 *  ID token and handles the standard { ok, data, error }
 *  envelope returned by every backend route.
 */

import { API_URL } from './config';
import { db, firebaseAuth, firebaseApp } from './firebase';
import { httpsCallable, getFunctions } from 'firebase/functions';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  addDoc,
} from 'firebase/firestore';
import { updateDoc, deleteDoc } from 'firebase/firestore';
import { chatWithGemini, GeminiChatPayload } from './gemini-client';

// ── Types mirroring backend payloads / responses ────────────

export interface ApiEnvelope<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Wins
export interface WinPayload {
  title: string;
  description?: string;
  amountSaved: number;
  category: 'swap' | 'meal' | 'budget' | 'challenge' | 'custom';
  emoji?: string;
}

export interface WinRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  amount_saved: number;
  category: string;
  emoji: string;
  created_at: string;
}

export interface WinsSummary {
  totalSaved: number;
  winCount: number;
  streakDays: number;
  thisWeek: number;
  thisMonth: number;
  byCategory: Record<string, { count: number; total: number }>;
  recentWins: WinRow[];
}

// Challenges
export interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward_description: string | null;
  reward_emoji: string;
  is_premium: boolean;
  sort_order: number;
  userChallenge?: {
    id: string;
    status: 'active' | 'completed' | 'abandoned';
    progress: number;
    started_at: string;
    completed_at: string | null;
  };
  locked?: boolean;
}

// Profile
export interface ProfileData {
  user: {
    id: string;
    email: string;
    hasPremium: boolean;
    premiumPlan: string;
    streakDays: number;
    totalSavings: number;
  };
  profile: {
    displayName: string | null;
    numKids: number;
    kidsAges: number[] | null;
    monthlyIncome: number | null;
    monthlyBudget: number | null;
    budgetCategories?: Array<{
      id: string;
      name: string;
      allocated: number;
      spent: number;
      icon: string;
    }> | null;
    savingsGoal: number | null;
    savingsGoalLabel: string | null;
    bio: string | null;
    avatarUrl: string | null;
    onboardingComplete: boolean;
    dietaryPreferences: string[] | null;
  };
  subscription: {
    plan: string;
    active: boolean;
  };
  stats: {
    totalWins: number;
    totalSaved: number;
    activeChallenges: number;
  };
}

export interface UpdateProfilePayload {
  displayName?: string;
  numKids?: number;
  kidsAges?: number[];
  monthlyIncome?: number;
  monthlyBudget?: number;
  budgetCategories?: Array<{
    id?: string;
    name: string;
    allocated: number;
    spent: number;
    icon: string;
  }>;
  savingsGoal?: number;
  savingsGoalLabel?: string;
  bio?: string;
  avatarUrl?: string;
  dietaryPreferences?: string[];
}

// AI: Smart Swap
export interface SmartSwapPayload {
  item: string;
  budget?: number;
}

export interface SmartSwapResponse {
  original: string;
  swaps: Array<{
    name: string;
    estimatedSaving: string;
    reason: string;
    emoji: string;
  }>;
  totalEstimatedSaving: string;
  tip: string;
}

// AI: Meal Plan
export interface MealPlanPayload {
  days: number;
  budget: number;
  numPeople: number;
  dietaryPreferences?: string[];
}

export interface MealPlanResponse {
  days: Array<{
    day: string;
    meals: {
      breakfast: { name: string; estimatedCost: string; emoji: string };
      lunch: { name: string; estimatedCost: string; emoji: string };
      dinner: { name: string; estimatedCost: string; emoji: string };
      snack: { name: string; estimatedCost: string; emoji: string };
    };
  }>;
  shoppingList: Array<{ item: string; estimatedCost: string }>;
  totalEstimatedCost: string;
  tips: string[];
}

// AI: Goal
export interface GoalPayload {
  goalAmount: number;
  goalLabel: string;
  timeframeMonths: number;
  currentSavings?: number;
}

export interface GoalResponse {
  monthlyTarget: string;
  weeklyTarget: string;
  dailyTarget: string;
  strategies: Array<{
    title: string;
    description: string;
    potentialSaving: string;
    emoji: string;
  }>;
  milestones: Array<{
    month: number;
    amount: string;
    celebration: string;
  }>;
  encouragement: string;
}

// AI: Chat
export interface ChatPayload {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  reply: string;
  suggestedActions?: string[];
}

// ── Error class ────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ── Endpoint Methods ────────────────────────────────────────

export const api = {
  // ── User ──
  initUser: async (email: string, displayName?: string) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;

    // Ensure a users doc exists
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      email,
      display_name: displayName ?? null,
      has_premium: false,
      premium_plan: 'free',
      streak_days: 0,
      total_savings: 0,
      updated_at: new Date().toISOString(),
    }, { merge: true });

    // Ensure a profiles doc exists
    const profileRef = doc(db, 'profiles', uid);
    const profileSnap = await getDoc(profileRef);
    const isNew = !profileSnap.exists();
    if (isNew) {
      await setDoc(profileRef, {
        display_name: displayName ?? null,
        num_kids: 0,
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return { user: { id: uid }, profile: profileSnap.data() ?? {}, isNew };
  },

  getProfile: () =>
    (async (): Promise<ProfileData> => {
      const user = firebaseAuth.currentUser;
      if (!user) throw new ApiError('Not authenticated', 401);
      const uid = user.uid;

      // Read profile doc
      const profileRef = doc(db, 'profiles', uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        // Return a sensible default shape when profile missing
        const emptyProfile: ProfileData = {
          user: {
            id: uid,
            email: user.email ?? '',
            hasPremium: false,
            premiumPlan: 'free',
            streakDays: 0,
            totalSavings: 0,
          },
          profile: {
            displayName: user.displayName ?? null,
            numKids: 0,
            kidsAges: null,
            monthlyIncome: null,
            monthlyBudget: null,
            budgetCategories: null,
            savingsGoal: null,
            savingsGoalLabel: null,
            bio: null,
            avatarUrl: null,
            onboardingComplete: false,
            dietaryPreferences: null,
          },
          subscription: {
            plan: 'free',
            active: false,
          },
          stats: {
            totalWins: 0,
            totalSaved: 0,
            activeChallenges: 0,
          },
        };
        return emptyProfile;
      }

      const profileData = profileSnap.data() ?? {};

      // Read user doc
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Wins summary
      const winsCol = collection(db, 'users', uid, 'wins');
      const winsSnap = await getDocs(winsCol);
      const totalWins = winsSnap.size;
      const totalSaved = winsSnap.docs.reduce((sum, d) => sum + (d.data().amount_saved || 0), 0);

      return {
        user: {
          id: uid,
          email: user.email ?? '',
          hasPremium: (userData as any)?.has_premium ?? false,
          premiumPlan: (userData as any)?.premium_plan ?? 'free',
          streakDays: (userData as any)?.streak_days ?? 0,
          totalSavings: (userData as any)?.total_savings ?? 0,
        },
        profile: {
          displayName: (profileData as any).display_name ?? null,
          numKids: (profileData as any).num_kids ?? 0,
          kidsAges: (profileData as any).kids_ages ?? null,
          monthlyIncome: (profileData as any).monthly_income ?? null,
          monthlyBudget: (profileData as any).monthly_budget ?? null,
          budgetCategories: (profileData as any).budget_categories ?? null,
          savingsGoal: (profileData as any).savings_goal ?? null,
          savingsGoalLabel: (profileData as any).savings_goal_label ?? null,
          bio: (profileData as any).bio ?? null,
          avatarUrl: (profileData as any).avatar_url ?? null,
          onboardingComplete: (profileData as any).onboarding_complete ?? false,
          dietaryPreferences: (profileData as any).dietary_preferences ?? null,
        },
        subscription: {
          plan: (userData as any)?.premium_plan ?? 'free',
          active: (userData as any)?.has_premium ?? false,
        },
        stats: {
          totalWins,
          totalSaved,
          activeChallenges: 0,
        },
      } as ProfileData;
    })(),

  updateProfile: async (payload: UpdateProfilePayload) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;

    const updates: Record<string, unknown> = {};
    if (payload.displayName !== undefined) updates.display_name = payload.displayName;
    if (payload.numKids !== undefined) updates.num_kids = payload.numKids;
    if (payload.kidsAges !== undefined) updates.kids_ages = payload.kidsAges;
    if (payload.monthlyIncome !== undefined) updates.monthly_income = payload.monthlyIncome;
    if (payload.monthlyBudget !== undefined) updates.monthly_budget = payload.monthlyBudget;
    if (payload.savingsGoal !== undefined) updates.savings_goal = payload.savingsGoal;
    if (payload.savingsGoalLabel !== undefined) updates.savings_goal_label = payload.savingsGoalLabel;
    if (payload.bio !== undefined) updates.bio = payload.bio;
    if (payload.avatarUrl !== undefined) updates.avatar_url = payload.avatarUrl;
    if (payload.budgetCategories !== undefined) updates.budget_categories = payload.budgetCategories;
    if (payload.dietaryPreferences !== undefined) updates.dietary_preferences = payload.dietaryPreferences;

    const meaningfulFields = ['displayName', 'numKids', 'monthlyBudget', 'savingsGoal', 'monthlyIncome'];
    if (meaningfulFields.some(f => (payload as any)[f] !== undefined)) {
      updates.onboarding_complete = true;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError('No fields to update', 400);
    }

    updates.updated_at = new Date().toISOString();

    // Merge updates into profile doc
    const profileRef = doc(db, 'profiles', uid);
    await setDoc(profileRef, updates, { merge: true });

    // Log activity
    try {
      await addDoc(collection(db, 'users', uid, 'activityLog'), {
        action: 'profile_updated',
        metadata: { fields: Object.keys(updates) },
        created_at: new Date().toISOString(),
      });
    } catch {
      // ignore logging errors on client
    }

    // Reuse getProfile to read back current state
    return api.getProfile() as Promise<ProfileData>;
  },

  // ── Todos (per-user subcollection) ──
  getTodos: async () => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const todosCol = collection(db, 'users', uid, 'todos');
    const snap = await getDocs(todosCol);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },

  addTodo: async (text: string) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const todosCol = collection(db, 'users', uid, 'todos');
    const now = new Date().toISOString();
    const docRef = await addDoc(todosCol, { text, completed: false, created_at: now, updated_at: now });
    const snap = await getDoc(docRef);
    return { id: docRef.id, ...(snap.data() as any) };
  },

  updateTodo: async (id: string, patch: { text?: string; completed?: boolean }) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const todoRef = doc(db, 'users', uid, 'todos', id);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), ...patch };
    await updateDoc(todoRef, updates);
    const snap = await getDoc(todoRef);
    return { id: snap.id, ...(snap.data() as any) };
  },

  deleteTodo: async (id: string) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const todoRef = doc(db, 'users', uid, 'todos', id);
    await deleteDoc(todoRef);
    return { id };
  },

  // ── Wins ──
  logWin: async (payload: WinPayload) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const now = new Date().toISOString();
    const winData = {
      user_id: uid,
      title: payload.title,
      description: payload.description ?? null,
      amount_saved: payload.amountSaved,
      category: payload.category,
      emoji: payload.emoji ?? '🌱',
      created_at: now,
    };
    const ref = await addDoc(collection(db, 'users', uid, 'wins'), winData);
    return { ...winData, id: ref.id } as WinRow;
  },

  getWins: async (params?: { page?: number; limit?: number; category?: string }) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const winsCol = collection(db, 'users', uid, 'wins');
    const snap = await getDocs(winsCol);
    let wins: WinRow[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WinRow));
    // Sort newest first
    wins.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    // Filter by category if requested
    if (params?.category) wins = wins.filter((w) => w.category === params.category);
    const limit = params?.limit ?? 50;
    const page = params?.page ?? 1;
    const start = (page - 1) * limit;
    return { wins: wins.slice(start, start + limit), total: wins.length, page, limit };
  },

  getWinsSummary: async (): Promise<WinsSummary> => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const winsCol = collection(db, 'users', uid, 'wins');
    const snap = await getDocs(winsCol);
    const wins = snap.docs.map((d) => d.data());
    const totalSaved = wins.reduce((s, w) => s + (w.amount_saved || 0), 0);
    const byCategory: Record<string, { count: number; total: number }> = {};
    wins.forEach((w) => {
      const cat = w.category ?? 'custom';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
      byCategory[cat].count += 1;
      byCategory[cat].total += w.amount_saved || 0;
    });
    return {
      totalSaved,
      winCount: wins.length,
      streakDays: 0,
      thisWeek: totalSaved,
      thisMonth: totalSaved,
      byCategory,
      recentWins: snap.docs.slice(0, 5).map((d) => ({ id: d.id, ...d.data() } as WinRow)),
    };
  },

  // ── Challenges ──
  getChallenges: async (): Promise<{ challenges: ChallengeRow[] }> => {
    const challengesCol = collection(db, 'challenges');
    const snap = await getDocs(challengesCol);
    const challenges: ChallengeRow[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChallengeRow, 'id'>),
    }));
    return { challenges };
  },

  // ── Per-user userChallenges (started/completed challenge instances) ──
  getUserChallenges: async () => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const col = collection(db, 'users', uid, 'userChallenges');
    const snap = await getDocs(col);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },

  startChallenge: async (challengeId: string) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const userChallengesCol = collection(db, 'users', uid, 'userChallenges');
    const ref = await addDoc(userChallengesCol, {
      challenge_id: challengeId,
      status: 'active',
      progress: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
    });
    return { id: ref.id };
  },

  completeChallenge: async (userChallengeId: string) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    const uid = user.uid;
    const userChallengeRef = doc(db, 'users', uid, 'userChallenges', userChallengeId);
    await setDoc(userChallengeRef, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    }, { merge: true });
    return { success: true };
  },

  // ── AI (Cloud Functions) ──
  smartSwap: async (payload: SmartSwapPayload) => {
    const functions = getFunctions(firebaseApp);
    const fn = httpsCallable<SmartSwapPayload, SmartSwapResponse>(functions, 'smartSwap');
    const result = await fn(payload);
    return result.data;
  },

  mealPlan: async (payload: MealPlanPayload) => {
    const functions = getFunctions(firebaseApp);
    const fn = httpsCallable<MealPlanPayload, MealPlanResponse>(functions, 'mealPlan');
    const result = await fn(payload);
    return result.data;
  },

  goalCalculator: async (payload: GoalPayload) => {
    const functions = getFunctions(firebaseApp);
    const fn = httpsCallable<GoalPayload, GoalResponse>(functions, 'goalCalculator');
    const result = await fn(payload);
    return result.data;
  },

  chat: async (payload: ChatPayload) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new ApiError('Not authenticated', 401);
    
    // Build user context from current profile
    const profileRef = doc(db, 'profiles', user.uid);
    const profileSnap = await getDoc(profileRef);
    const profileData = profileSnap.data();
    
    const winsCol = collection(db, 'users', user.uid, 'wins');
    const winsSnap = await getDocs(winsCol);
    const recentWins = winsSnap.docs.slice(0, 3).map(d => ({
      title: d.data().title,
      amountSaved: d.data().amount_saved,
    }));
    
    // Call Gemini directly with user context
    const geminiPayload: GeminiChatPayload = {
      message: payload.message,
      conversationHistory: payload.conversationHistory,
      userContext: {
        totalSaved: winsSnap.docs.reduce((sum, d) => sum + (d.data().amount_saved || 0), 0),
        monthlyBudget: profileData?.monthly_budget,
        streakDays: 0,
        recentWins,
      },
    };
    
    return chatWithGemini(user.uid, geminiPayload);
  },
};
