/**
 * ════════════════════════════════════════════
 *  Auth Middleware — requireAuth
 * ════════════════════════════════════════════
 *  Verifies a Firebase ID token and resolves
 *  the Firestore user. Attaches `user` to context.
 *
 *  Usage in a handler:
 *    const user = await requireAuth(req, res);
 *    if (!user) return;  // response already sent
 */

import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../types';
import { db, auth } from '../lib/firebase';
import { sendError, Errors } from '../lib/errors';

/**
 * Authenticate the request and return the Flourish user.
 *
 * 1. Extract & verify the Firebase ID token from the Authorization header
 * 2. Look up (or lazily create) the user in Firestore
 * 3. Return a clean AuthenticatedUser object
 *
 * If auth fails, sends a 401 and returns null.
 */
export async function requireAuth(
  req: Request,
  res: Response
): Promise<AuthenticatedUser | null> {
  try {
    // ① Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, Errors.unauthorized());
      return null;
    }

    const idToken = authHeader.slice(7);

    // ② Verify Firebase ID token
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email ?? '';

    // ③ Find user in Firestore
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const data = userSnap.data()!;
      return {
        id: uid,
        email: data.email ?? email,
        hasPremium: data.has_premium ?? false,
        premiumPlan: data.premium_plan ?? 'free',
      };
    }

    // ④ User doesn't exist yet — auto-create (safety net)
    const now = new Date().toISOString();
    const newUser = {
      email,
      has_premium: false,
      premium_plan: 'free',
      revenuecat_id: null,
      streak_days: 0,
      total_savings: 0,
      created_at: now,
      updated_at: now,
    };

    await userRef.set(newUser);

    // Also create an empty profile
    await db.collection('profiles').doc(uid).set({
      display_name: null,
      num_kids: 0,
      kids_ages: null,
      monthly_income: null,
      monthly_budget: null,
      savings_goal: null,
      savings_goal_label: null,
      bio: null,
      avatar_url: null,
      onboarding_complete: false,
      dietary_preferences: null,
      created_at: now,
      updated_at: now,
    });

    return {
      id: uid,
      email,
      hasPremium: false,
      premiumPlan: 'free',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    console.error('[Auth]', message);
    sendError(res, Errors.unauthorized());
    return null;
  }
}
