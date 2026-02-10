/**
 * ════════════════════════════════════════════
 *  POST /api/challenges/start
 * ════════════════════════════════════════════
 *  Start a challenge. Premium challenges require
 *  an active subscription.
 *
 *  Body: { challengeId: string }
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { db } from '../../lib/firebase';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { StartChallengePayload } from '../../types';

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'POST', res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const body = req.body as StartChallengePayload;

    if (!body?.challengeId) {
      sendError(res, Errors.badRequest('challengeId is required'));
      return;
    }

    // ── Fetch the challenge ───────────────
    const chalSnap = await db.collection('challenges').doc(body.challengeId).get();

    if (!chalSnap.exists) {
      sendError(res, Errors.notFound('Challenge'));
      return;
    }

    const challenge = { id: chalSnap.id, ...chalSnap.data()! };

    // ── Premium gate (disabled for MVP — client-side gating only) ──
    // if ((challenge as any).is_premium) { ... }

    // ── Check if already started ──────────
    const ucRef = db.collection('users').doc(user.id).collection('userChallenges');
    const existingSnap = await ucRef
      .where('challenge_id', '==', body.challengeId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0];
      const existingData = existing.data();

      if (existingData.status === 'active') {
        sendError(res, Errors.conflict('You\'ve already started this challenge!'));
        return;
      }
      // If completed or abandoned, allow restart
      await existing.ref.delete();
    }

    // ── Start the challenge ───────────────
    const ucData = {
      challenge_id: body.challengeId,
      status: 'active',
      progress: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
    };

    const ucDoc = await ucRef.add(ucData);
    const userChallenge = { id: ucDoc.id, user_id: user.id, ...ucData };

    // ── Log activity ──────────────────────
    await db.collection('users').doc(user.id).collection('activityLog').add({
      action: 'challenge_started',
      metadata: { challenge_id: body.challengeId, title: (challenge as any).title },
      created_at: new Date().toISOString(),
    });

    sendSuccess(res, {
      userChallenge,
      challenge,
      message: `You've started "${(challenge as any).title}"! 🌱`,
    }, 201);
  } catch (err) {
    sendError(res, err);
  }
}
