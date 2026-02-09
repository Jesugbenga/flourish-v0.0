/**
 * ════════════════════════════════════════════
 *  POST /api/user/init
 * ════════════════════════════════════════════
 *  Called once when a user first opens the app
 *  after Firebase authentication. Creates the
 *  user and profile in Firestore.
 *
 *  Body: { email: string, displayName?: string }
 */

import type { Request, Response } from 'express';
import { db, auth } from '../../lib/firebase';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { InitUserPayload } from '../../types';

export default async function handler(req: Request, res: Response) {
  // ── Method check ────────────────────────
  if (!assertMethod(req.method, 'POST', res)) return;

  try {
    // ── Auth ──────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, Errors.unauthorized());
      return;
    }

    const idToken = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const firebaseEmail = decoded.email ?? '';

    // ── Parse body ────────────────────────
    const body = req.body as InitUserPayload;
    const email = body?.email || firebaseEmail;
    const displayName = body?.displayName ?? null;

    if (!email) {
      sendError(res, Errors.badRequest('Email is required'));
      return;
    }

    // ── Check if user already exists ──────
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      // Already initialised — return current data
      const userData = { id: uid, ...userSnap.data() };
      const profileSnap = await db.collection('profiles').doc(uid).get();
      const profileData = profileSnap.exists ? profileSnap.data() : null;

      sendSuccess(res, {
        user: userData,
        profile: profileData,
        isNew: false,
      });
      return;
    }

    // ── Create user ───────────────────────
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

    // ── Create profile ────────────────────
    const newProfile = {
      display_name: displayName,
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
    };

    await db.collection('profiles').doc(uid).set(newProfile);

    // ── Log activity ──────────────────────
    await db.collection('users').doc(uid).collection('activityLog').add({
      action: 'app_open',
      metadata: { event: 'first_init' },
      created_at: now,
    });

    sendSuccess(res, {
      user: { id: uid, ...newUser },
      profile: newProfile,
      isNew: true,
    }, 201);

  } catch (err) {
    sendError(res, err);
  }
}
