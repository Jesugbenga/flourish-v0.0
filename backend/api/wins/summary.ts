/**
 * ════════════════════════════════════════════
 *  GET /api/wins/summary
 * ════════════════════════════════════════════
 *  Returns an aggregated summary of the user's
 *  wins: total saved, streaks, category breakdown.
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { db } from '../../lib/firebase';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { WinsSummary, WinCategory, DbWin } from '../../types';

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'GET', res)) return;

  // ── Auth ────────────────────────────────
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    // ── Fetch all wins ────────────────────
    const snap = await db
      .collection('users').doc(user.id).collection('wins')
      .orderBy('created_at', 'desc')
      .get();

    const wins: DbWin[] = snap.docs.map(d => ({
      id: d.id,
      user_id: user.id,
      ...d.data(),
    })) as DbWin[];

    // ── Calculate totals ──────────────────
    const totalSaved = wins.reduce((sum, w) => sum + Number(w.amount_saved), 0);
    const winCount = wins.length;

    // ── This week / this month ────────────
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeek = wins
      .filter(w => new Date(w.created_at) >= weekAgo)
      .reduce((sum, w) => sum + Number(w.amount_saved), 0);

    const thisMonth = wins
      .filter(w => new Date(w.created_at) >= monthStart)
      .reduce((sum, w) => sum + Number(w.amount_saved), 0);

    // ── Category breakdown ────────────────
    const categories: WinCategory[] = ['swap', 'meal', 'budget', 'challenge', 'custom'];
    const byCategory = {} as Record<WinCategory, { count: number; total: number }>;

    for (const cat of categories) {
      const catWins = wins.filter(w => w.category === cat);
      byCategory[cat] = {
        count: catWins.length,
        total: catWins.reduce((sum, w) => sum + Number(w.amount_saved), 0),
      };
    }

    // ── User stats ────────────────────────
    const userSnap = await db.collection('users').doc(user.id).get();
    const userData = userSnap.data();

    // ── Build summary ─────────────────────
    const summary: WinsSummary = {
      totalSaved: Math.round(totalSaved * 100) / 100,
      winCount,
      streakDays: userData?.streak_days ?? 0,
      thisWeek: Math.round(thisWeek * 100) / 100,
      thisMonth: Math.round(thisMonth * 100) / 100,
      byCategory,
      recentWins: wins.slice(0, 5),  // latest 5
    };

    sendSuccess(res, summary);
  } catch (err) {
    sendError(res, err);
  }
}
