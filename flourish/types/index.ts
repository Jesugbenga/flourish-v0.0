// ─── Flourish Type Definitions ─────────────────────────────────────────

export interface DailyTip {
  id: string;
  title: string;
  body: string;
  category: 'swap' | 'meal' | 'invest' | 'budget' | 'general';
  savingsEstimate?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: string;
}

export interface SmartSwapItem {
  id: string;
  originalItem: string;
  originalPrice: number;
  alternative: string;
  alternativePrice: number;
  savingsWeekly: number;
  savingsYearly: number;
  confidence: number;
}

export interface MealPlan {
  id: string;
  name: string;
  costPerServing: number;
  savingsVsTakeout: number;
  prepTime: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  icon: string;
}

export interface SavingsWin {
  id: string;
  type: 'swap' | 'meal' | 'budget' | 'challenge';
  description: string;
  amount: number;
  date: string;
}

export interface ChallengeDay {
  day: number;
  title: string;
  description: string;
  completed: boolean;
  savingsEstimate: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  cards: LessonCard[];
  icon: string;
}

export interface LessonCard {
  title: string;
  body: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  content: string;
  savings: number;
  likes: number;
  timeAgo: string;
}

export interface UserProfile {
  name: string;
  totalSavings: number;
  swapSavings: number;
  mealSavings: number;
  budgetSavings: number;
  challengeSavings: number;
  streak: number;
  joinDate: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  weeklyGoal: number;
  timeframe: string;
}

export interface RebeccaPost {
  id: string;
  title: string;
  body: string;
  date: string;
}
