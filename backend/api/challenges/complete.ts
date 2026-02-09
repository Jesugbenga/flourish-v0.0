/**
 * ════════════════════════════════════════════
 *  POST /api/challenges/complete
 * ════════════════════════════════════════════
 *  Mark a user's active challenge as completed.
 *  Automatically creates a Win entry.
 *
 *  Body: { userChallengeId: string }
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { db } from '../../lib/firebase';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { CompleteChallengePayload } from '../../types';

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'POST', res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const body = req.body as CompleteChallengePayload;

    if (!body?.userChallengeId) {
      sendError(res, Errors.badRequest('userChallengeId is required'));
      return;
    }

    // ── Fetch the user challenge ──────────
    const ucRef = db
      .collection('users').doc(user.id)
      .collection('userChallenges').doc(body.userChallengeId);

    const ucSnap = await ucRef.get();

    if (!ucSnap.exists) {
      sendError(res, Errors.notFound('Challenge progress'));
      return;
    }

    const ucData = ucSnap.data()!;

    if (ucData.status === 'completed') {
      sendError(res, Errors.conflict('This challenge is already completed! 🎉'));
      return;
    }

    if (ucData.status !== 'active') {
      sendError(res, Errors.badRequest('This challenge is not active'));
      return;
    }

    // ── Fetch the challenge details ───────
    const chalSnap = await db.collection('challenges').doc(ucData.challenge_id).get();
    const challenge = chalSnap.exists ? chalSnap.data()! : { title: 'Challenge', reward_description: null, reward_emoji: '🏆', duration_days: 0 };

    // ── Mark as completed ─────────────────
    const now = new Date().toISOString();
    await ucRef.update({
      status: 'completed',
      progress: 100,
      completed_at: now,
    });

    const updated = { id: ucSnap.id, user_id: user.id, ...ucData, status: 'completed', progress: 100, completed_at: now };

    // ── Auto-create a Win ─────────────────
    const winData = {
      title: `Completed: ${challenge.title}`,
      description: challenge.reward_description ?? 'Challenge completed!',
      amount_saved: 0,  // Challenges don't always have monetary value
      category: 'challenge',
      emoji: challenge.reward_emoji ?? '🏆',
      created_at: now,
    };

    const winDoc = await db.collection('users').doc(user.id).collection('wins').add(winData);
    const win = { id: winDoc.id, user_id: user.id, ...winData };

    // ── Log activity ──────────────────────
    await db.collection('users').doc(user.id).collection('activityLog').add({
      action: 'challenge_completed',
      metadata: {
        challenge_id: ucData.challenge_id,
        title: challenge.title,
        duration_days: challenge.duration_days,
      },
      created_at: now,
    });

    sendSuccess(res, {
      userChallenge: updated,
      win,
      message: `Amazing! You completed "${challenge.title}"! ${challenge.reward_emoji ?? '🏆'}`,
    });
  } catch (err) {
    sendError(res, err);
  }
}
