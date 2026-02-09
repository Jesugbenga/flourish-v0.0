/**
 * ════════════════════════════════════════════
 *  Flourish — Feature Gate
 * ════════════════════════════════════════════
 *  Centralises free-vs-premium access rules.
 */

export type Feature =
  | 'smart-swap'
  | 'meal-planner'
  | 'goal-calculator'
  | 'challenges'
  | 'community-post'
  | 'ai-chat'
  | 'lessons'
  | 'rebeccas-corner';

interface GateRule {
  /** Free-tier users get access? */
  free: boolean;
  /** Description shown on paywall */
  label: string;
}

const rules: Record<Feature, GateRule> = {
  'smart-swap':      { free: false, label: 'Unlimited Smart Swaps' },
  'meal-planner':    { free: false, label: 'AI Meal Planner' },
  'goal-calculator': { free: false, label: 'Goal Calculator' },
  'challenges':      { free: true,  label: 'Weekly Challenges' },   // free users get basic ones
  'community-post':  { free: false, label: 'Community Posting' },
  'ai-chat':         { free: true, label: 'Chat with Flo' },
  'lessons':         { free: true,  label: 'Lessons' },             // free users see first card
  'rebeccas-corner': { free: false, label: "Rebecca's Corner" },
};

/**
 * Check if a user can access a given feature.
 * @param feature  Feature key
 * @param hasPremium  Whether the user has an active premium subscription
 */
export function canAccess(feature: Feature, hasPremium: boolean): boolean {
  if (hasPremium) return true;
  return rules[feature]?.free ?? false;
}

/** Get the paywall label for a feature */
export function getFeatureLabel(feature: Feature): string {
  return rules[feature]?.label ?? feature;
}
