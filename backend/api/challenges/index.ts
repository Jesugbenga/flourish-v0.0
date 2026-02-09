/**
 * ════════════════════════════════════════════
 *  GET /api/challenges
 * ════════════════════════════════════════════
 *  Returns all available challenges with the
 *  user's progress (if they've started any).
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { db } from '../../lib/firebase';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'GET', res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    // Fetch all challenges
    const chalSnap = await db
      .collection('challenges')
      .orderBy('sort_order', 'asc')
      .get();

    const challenges = chalSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch user's challenge progress
    const ucSnap = await db
      .collection('users').doc(user.id).collection('userChallenges')
      .get();

    const userChallenges = ucSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Merge: attach user progress to each challenge
    const enriched = challenges.map(challenge => {
      const userProgress = userChallenges.find(
        (uc: any) => uc.challenge_id === challenge.id
      );

      return {
        ...challenge,
        // Gate premium challenges for free users
        locked: (challenge as any).is_premium && !user.hasPremium,
        userProgress: userProgress
          ? {
              status: (userProgress as any).status,
              progress: (userProgress as any).progress,
              startedAt: (userProgress as any).started_at,
              completedAt: (userProgress as any).completed_at,
              userChallengeId: userProgress.id,
            }
          : null,
      };
    });

    sendSuccess(res, { challenges: enriched });
  } catch (err) {
    sendError(res, err);
  }
}
