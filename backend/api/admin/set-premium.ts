/**
 * ════════════════════════════════════════════
 *  POST /api/admin/set-premium
 * ════════════════════════════════════════════
 *  ADMIN ONLY — Manually toggle premium status
 *  for a user. For hackathon demo purposes.
 *
 *  Body: { uid: string, hasPremium: boolean }
 *  Headers: Authorization: Bearer <firebase-id-token>
 *           (Token owner must be the user being modified)
 */

import type { Request, Response } from 'express';
import { db, auth } from '../../lib/firebase';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';

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

    // ── Parse body ────────────────────────
    const body = req.body as { uid?: string; hasPremium?: boolean };
    const targetUid = body?.uid || uid;
    const hasPremium = body?.hasPremium ?? true;

    // For hackathon: allow users to toggle their own premium status
    if (targetUid !== uid) {
      sendError(res, Errors.forbidden());
      return;
    }

    // ── Update user ───────────────────────
    const userRef = db.collection('users').doc(targetUid);
    await userRef.update({
      has_premium: hasPremium,
      premium_plan: hasPremium ? 'hackathon' : 'free',
      updated_at: new Date().toISOString(),
    });

    // ── Return updated data ───────────────
    const updated = await userRef.get();
    sendSuccess(res, { user: updated.data() });
  } catch (err) {
    sendError(res, err);
  }
}
