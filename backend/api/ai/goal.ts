/**
 * ════════════════════════════════════════════
 *  POST /api/ai/goal
 * ════════════════════════════════════════════
 *  Goal-based savings calculator. Given a target
 *  amount and timeframe, Gemini provides a
 *  strategy with milestones and encouragement.
 *
 *  🔒 Premium only
 *  Body: { goalAmount, goalLabel, timeframeMonths, currentSavings? }
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requirePremium } from '../../middleware/require-premium';
import { db } from '../../lib/firebase';
import { generateAiResponse, logAiUsage } from '../../lib/gemini';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { GoalPayload, GoalResponse, DbUserProfile } from '../../types';

// ── System Prompt ─────────────────────────

const SYSTEM_PROMPT = `You are a supportive, calm financial coach for UK mums.
The user has a savings goal. Calculate a realistic plan and provide encouragement.

Rules:
- Be warm, never preachy
- Use UK-relevant suggestions (ISAs, supermarket savings, etc.)
- Provide 3-4 practical strategies with estimated savings
- Create motivating milestones with mini celebrations
- End with genuine encouragement

Respond in this exact JSON format:
{
  "monthlyTarget": "£XX.XX",
  "weeklyTarget": "£XX.XX",
  "dailyTarget": "£X.XX",
  "strategies": [
    { "title": "Strategy name", "description": "How to do it", "potentialSaving": "£XX/month", "emoji": "💡" }
  ],
  "milestones": [
    { "month": 3, "amount": "£XXX", "celebration": "Treat yourself to a coffee! ☕" }
  ],
  "encouragement": "A warm, motivating message"
}`;

// ── Mock Response ─────────────────────────

const MOCK_RESPONSE: GoalResponse = {
  monthlyTarget: '£166.67',
  weeklyTarget: '£41.67',
  dailyTarget: '£5.95',
  strategies: [
    {
      title: 'The Smart Swap Savings',
      description: 'Switch to own-brand products for your weekly shop. Most families save £15-20/week.',
      potentialSaving: '£70/month',
      emoji: '🛒',
    },
    {
      title: 'Round-Up Rule',
      description: 'Round up every purchase to the nearest pound and save the difference.',
      potentialSaving: '£30/month',
      emoji: '🪙',
    },
    {
      title: 'Subscription Audit',
      description: 'Cancel unused subscriptions. The average family has 2-3 they don\'t use.',
      potentialSaving: '£25/month',
      emoji: '✂️',
    },
    {
      title: 'Meal Prep Sundays',
      description: 'Batch cook meals on Sunday to avoid expensive midweek takeaways.',
      potentialSaving: '£50/month',
      emoji: '🍳',
    },
  ],
  milestones: [
    { month: 1, amount: '£167', celebration: 'First month done! You\'re building a habit 🌱' },
    { month: 3, amount: '£500', celebration: 'Halfway to £1000! Treat yourself to a nice coffee ☕' },
    { month: 6, amount: '£1,000', celebration: 'FOUR figures! You\'re doing amazing 🎉' },
    { month: 12, amount: '£2,000', celebration: 'You did it! Goal reached! 🏆🎊' },
  ],
  encouragement: 'You\'re already ahead by planning this — most people never start. Every little bit adds up, and your kids will thank you for it. You\'ve got this, mama! 💚',
};

// ── Handler ───────────────────────────────

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'POST', res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requirePremium(user, res)) return;

  try {
    const body = req.body as GoalPayload;

    if (!body?.goalAmount || !body?.goalLabel || !body?.timeframeMonths) {
      sendError(res, Errors.badRequest('goalAmount, goalLabel, and timeframeMonths are required'));
      return;
    }

    if (body.goalAmount <= 0 || body.timeframeMonths <= 0) {
      sendError(res, Errors.badRequest('goalAmount and timeframeMonths must be positive'));
      return;
    }

    // Fetch user profile for context
    const profileSnap = await db.collection('profiles').doc(user.id).get();
    const profile = profileSnap.exists ? (profileSnap.data() as DbUserProfile) : null;

    const currentStr = body.currentSavings ? ` I've already saved £${body.currentSavings}.` : '';
    const userPrompt = `I want to save £${body.goalAmount} for "${body.goalLabel}" in ${body.timeframeMonths} months.${currentStr} What's my plan?`;

    const result = await generateAiResponse<GoalResponse>({
      userId: user.id,
      endpoint: 'goal',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      userProfile: profile,
      mockResponse: MOCK_RESPONSE,
    });

    await logAiUsage(user.id, 'goal', false);

    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err);
  }
}
