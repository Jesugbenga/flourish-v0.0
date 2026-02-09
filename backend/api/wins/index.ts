/**
 * ════════════════════════════════════════════
 *  POST /api/wins — log a new win
 *  GET  /api/wins — list recent wins
 * ════════════════════════════════════════════
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { db } from '../../lib/firebase';
import { sendSuccess, sendError, Errors } from '../../lib/errors';
import type { CreateWinPayload } from '../../types';

export default async function handler(req: Request, res: Response) {
  // ── Auth ────────────────────────────────
  const user = await requireAuth(req, res);
  if (!user) return;

  const winsRef = db.collection('users').doc(user.id).collection('wins');

  // ── POST: Log a new win ─────────────────
  if (req.method === 'POST') {
    try {
      const body = req.body as CreateWinPayload;

      // Validate required fields
      if (!body?.title || body.amountSaved === undefined || !body.category) {
        sendError(res, Errors.badRequest('title, amountSaved, and category are required'));
        return;
      }

      // Validate category
      const validCategories = ['swap', 'meal', 'budget', 'challenge', 'custom'];
      if (!validCategories.includes(body.category)) {
        sendError(res, Errors.badRequest(`category must be one of: ${validCategories.join(', ')}`));
        return;
      }

      // Insert win
      const winData = {
        title: body.title,
        description: body.description ?? null,
        amount_saved: body.amountSaved,
        category: body.category,
        emoji: body.emoji ?? '🎉',
        created_at: new Date().toISOString(),
      };

      const winDoc = await winsRef.add(winData);
      const win = { id: winDoc.id, user_id: user.id, ...winData };

      // Update user total savings
      const userRef = db.collection('users').doc(user.id);
      const userSnap = await userRef.get();
      const userData = userSnap.data();

      if (userData) {
        const newTotal = Number(userData.total_savings ?? 0) + body.amountSaved;
        await userRef.update({
          total_savings: newTotal,
          streak_days: (userData.streak_days ?? 0) + 1,  // simplified streak logic
          updated_at: new Date().toISOString(),
        });
      }

      // Log activity
      await db.collection('users').doc(user.id).collection('activityLog').add({
        action: 'win_logged',
        metadata: { win_id: winDoc.id, category: body.category, amount: body.amountSaved },
        created_at: new Date().toISOString(),
      });

      sendSuccess(res, { win }, 201);
    } catch (err) {
      sendError(res, err);
    }
    return;
  }

  // ── GET: List recent wins ───────────────
  if (req.method === 'GET') {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;
      const category = req.query.category as string | undefined;

      let query: FirebaseFirestore.Query = winsRef
        .orderBy('created_at', 'desc');

      if (category) {
        query = query.where('category', '==', category);
      }

      // Firestore doesn't have a native offset — fetch extra and slice
      const snap = await query.limit(offset + limit).get();
      const allDocs = snap.docs.slice(offset);

      const wins = allDocs.map(d => ({
        id: d.id,
        user_id: user.id,
        ...d.data(),
      }));

      // Get approximate total count
      const countSnap = category
        ? await winsRef.where('category', '==', category).count().get()
        : await winsRef.count().get();

      sendSuccess(res, {
        wins,
        total: countSnap.data().count,
        limit,
        offset,
      });
    } catch (err) {
      sendError(res, err);
    }
    return;
  }

  sendError(res, Errors.methodNotAllowed('GET, POST'));
}
