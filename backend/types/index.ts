/**
 * ════════════════════════════════════════════
 *  Flourish Backend — Type Definitions
 * ════════════════════════════════════════════
 *  Mirrors the Firestore schema + API payloads.
 */

import type { Request, Response } from 'express';

// ── Database Row Types ─────────────────────

export interface DbUser {
  id: string;
  email: string;
  has_premium: boolean;
  premium_plan: 'free' | 'monthly' | 'annual';
  revenuecat_id: string | null;
  streak_days: number;
  total_savings: number;
  created_at: string;
  updated_at: string;
}

export interface DbUserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  num_kids: number;
  kids_ages: number[] | null;
  monthly_income: number | null;
  monthly_budget: number | null;
  savings_goal: number | null;
  savings_goal_label: string | null;
  bio: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  dietary_preferences: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DbWin {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  amount_saved: number;
  category: WinCategory;
  emoji: string;
  created_at: string;
}

export type WinCategory = 'swap' | 'meal' | 'budget' | 'challenge' | 'custom';

export interface DbChallenge {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  category: ChallengeCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  reward_description: string | null;
  reward_emoji: string;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
}

export type ChallengeCategory = 'saving' | 'spending' | 'meal' | 'investing';

export interface DbUserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'active' | 'completed' | 'abandoned';
  progress: number;
  started_at: string;
  completed_at: string | null;
}

export interface DbBudgetEntry {
  id: string;
  user_id: string;
  category: string;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  created_at: string;
}

export interface DbActivityLog {
  id: string;
  user_id: string;
  action: ActivityAction;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ActivityAction =
  | 'app_open'
  | 'win_logged'
  | 'challenge_started'
  | 'challenge_completed'
  | 'ai_used'
  | 'lesson_viewed'
  | 'profile_updated';

export interface DbAiCache {
  id: string;
  user_id: string;
  endpoint: AiEndpoint;
  prompt_hash: string;
  response: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

export type AiEndpoint = 'smart-swap' | 'meal-plan' | 'goal' | 'chat';

// ── API Request / Response Types ──────────

/** Authenticated user attached to the request by middleware */
export interface AuthenticatedUser {
  id: string;            // Firebase UID (document ID in Firestore)
  email: string;
  hasPremium: boolean;
  premiumPlan: string;
}

/** Extended Express request with authenticated user */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/** Standard API envelope */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── API Payload Types ─────────────────────

export interface InitUserPayload {
  email: string;
  displayName?: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  numKids?: number;
  kidsAges?: number[];
  monthlyIncome?: number;
  monthlyBudget?: number;
  savingsGoal?: number;
  savingsGoalLabel?: string;
  bio?: string;
  avatarUrl?: string;
  dietaryPreferences?: string[];
}

export interface CreateWinPayload {
  title: string;
  description?: string;
  amountSaved: number;
  category: WinCategory;
  emoji?: string;
}

export interface StartChallengePayload {
  challengeId: string;
}

export interface CompleteChallengePayload {
  userChallengeId: string;
}

// ── AI Payload Types ──────────────────────

export interface SmartSwapPayload {
  item: string;           // e.g. "branded cereal"
  budget?: number;        // optional budget context
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

export interface MealPlanPayload {
  days: number;           // 1-7
  budget: number;         // weekly budget
  numPeople: number;
  dietaryPreferences?: string[];
}

export interface MealPlanResponse {
  days: Array<{
    day: string;
    meals: {
      breakfast: MealItem;
      lunch: MealItem;
      dinner: MealItem;
      snack: MealItem;
    };
  }>;
  shoppingList: Array<{ item: string; estimatedCost: string }>;
  totalEstimatedCost: string;
  tips: string[];
}

export interface MealItem {
  name: string;
  estimatedCost: string;
  emoji: string;
}

export interface GoalPayload {
  goalAmount: number;     // e.g. 5000
  goalLabel: string;      // e.g. "Family holiday"
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

export interface ChatPayload {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  reply: string;
  suggestedActions?: string[];
}

// ── Wins Summary ──────────────────────────

export interface WinsSummary {
  totalSaved: number;
  winCount: number;
  streakDays: number;
  thisWeek: number;
  thisMonth: number;
  byCategory: Record<WinCategory, { count: number; total: number }>;
  recentWins: DbWin[];
}

// ── RevenueCat Webhook ────────────────────

export interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    environment: string;
    store: string;
  };
}
