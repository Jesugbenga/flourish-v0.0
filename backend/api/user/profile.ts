/**
 * ════════════════════════════════════════════
 *  GET  /api/user/profile — fetch profile
 *  PUT  /api/user/profile — update profile
 * ════════════════════════════════════════════
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { db } from '../../lib/firebase';
import { sendSuccess, sendError, Errors } from '../../lib/errors';
import type { UpdateProfilePayload } from '../../types';

export default async function handler(req: Request, res: Response) {
  // ── Auth ────────────────────────────────
  const user = await requireAuth(req, res);
  if (!user) return;

  // ── GET: Fetch profile ──────────────────
  if (req.method === 'GET') {
    try {
      const profileSnap = await db.collection('profiles').doc(user.id).get();

      if (!profileSnap.exists) {
        sendError(res, Errors.notFound('Profile'));
        return;
      }

      const profileData = profileSnap.data()!;

      // Also fetch user-level data
      const userSnap = await db.collection('users').doc(user.id).get();
      const userData = userSnap.data();

      // Fetch wins summary for stats
      const winsSnap = await db.collection('users').doc(user.id).collection('wins').get();
      const totalWins = winsSnap.docs.length;
      const totalSaved = winsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount_saved || 0), 0);

      // Transform to camelCase for frontend
      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email || '',
          hasPremium: userData?.has_premium ?? false,
          premiumPlan: userData?.premium_plan ?? 'free',
          streakDays: userData?.streak_days ?? 0,
          totalSavings: userData?.total_savings ?? 0,
        },
        profile: {
          displayName: profileData.display_name ?? null,
          numKids: profileData.num_kids ?? 0,
          kidsAges: profileData.kids_ages ?? null,
          monthlyIncome: profileData.monthly_income ?? null,
          monthlyBudget: profileData.monthly_budget ?? null,
          savingsGoal: profileData.savings_goal ?? null,
          savingsGoalLabel: profileData.savings_goal_label ?? null,
          bio: profileData.bio ?? null,
          avatarUrl: profileData.avatar_url ?? null,
          onboardingComplete: profileData.onboarding_complete ?? false,
          dietaryPreferences: profileData.dietary_preferences ?? null,
        },
        subscription: {
          plan: userData?.premium_plan ?? 'free',
          active: userData?.has_premium ?? false,
        },
        stats: {
          totalWins,
          totalSaved,
          activeChallenges: 0,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
    return;
  }

  // ── PUT: Update profile ─────────────────
  if (req.method === 'PUT') {
    try {
      const body = req.body as UpdateProfilePayload;

      // Build update object (only include provided fields)
      const updates: Record<string, unknown> = {};
      if (body.displayName !== undefined)       updates.display_name = body.displayName;
      if (body.numKids !== undefined)           updates.num_kids = body.numKids;
      if (body.kidsAges !== undefined)          updates.kids_ages = body.kidsAges;
      if (body.monthlyIncome !== undefined)     updates.monthly_income = body.monthlyIncome;
      if (body.monthlyBudget !== undefined)     updates.monthly_budget = body.monthlyBudget;
      if (body.savingsGoal !== undefined)       updates.savings_goal = body.savingsGoal;
      if (body.savingsGoalLabel !== undefined)  updates.savings_goal_label = body.savingsGoalLabel;
      if (body.bio !== undefined)               updates.bio = body.bio;
      if (body.avatarUrl !== undefined)         updates.avatar_url = body.avatarUrl;
      if (body.dietaryPreferences !== undefined) updates.dietary_preferences = body.dietaryPreferences;

      // Mark onboarding complete if any meaningful profile field is provided
      const meaningfulFields = ['displayName', 'numKids', 'monthlyBudget', 'savingsGoal', 'monthlyIncome'];
      if (meaningfulFields.some(f => body[f as keyof UpdateProfilePayload] !== undefined)) {
        updates.onboarding_complete = true;
      }

      if (Object.keys(updates).length === 0) {
        sendError(res, Errors.badRequest('No fields to update'));
        return;
      }

      updates.updated_at = new Date().toISOString();

      // Use set with merge to handle cases where the profile doc may not exist yet
      const profileRef = db.collection('profiles').doc(user.id);
      await profileRef.set(updates, { merge: true });

      // Read back updated profile
      const updatedSnap = await profileRef.get();
      const profileData = updatedSnap.data()!;

      // Fetch user data for response
      const userSnap = await db.collection('users').doc(user.id).get();
      const userData = userSnap.data();

      // Fetch wins summary for stats
      const winsSnap = await db.collection('users').doc(user.id).collection('wins').get();
      const totalWins = winsSnap.docs.length;
      const totalSaved = winsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount_saved || 0), 0);

      // Log activity
      await db.collection('users').doc(user.id).collection('activityLog').add({
        action: 'profile_updated',
        metadata: { fields: Object.keys(updates) },
        created_at: new Date().toISOString(),
      });

      // Transform to camelCase for frontend
      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email || '',
          hasPremium: userData?.has_premium ?? false,
          premiumPlan: userData?.premium_plan ?? 'free',
          streakDays: userData?.streak_days ?? 0,
          totalSavings: userData?.total_savings ?? 0,
        },
        profile: {
          displayName: profileData.display_name ?? null,
          numKids: profileData.num_kids ?? 0,
          kidsAges: profileData.kids_ages ?? null,
          monthlyIncome: profileData.monthly_income ?? null,
          monthlyBudget: profileData.monthly_budget ?? null,
          savingsGoal: profileData.savings_goal ?? null,
          savingsGoalLabel: profileData.savings_goal_label ?? null,
          bio: profileData.bio ?? null,
          avatarUrl: profileData.avatar_url ?? null,
          onboardingComplete: profileData.onboarding_complete ?? false,
          dietaryPreferences: profileData.dietary_preferences ?? null,
        },
        subscription: {
          plan: userData?.premium_plan ?? 'free',
          active: userData?.has_premium ?? false,
        },
        stats: {
          totalWins,
          totalSaved,
          activeChallenges: 0,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
    return;
  }

  // ── Unsupported method ──────────────────
  sendError(res, Errors.methodNotAllowed('GET, PUT'));
}
