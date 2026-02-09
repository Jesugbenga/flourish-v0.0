/**
 * ════════════════════════════════════════════
 *  POST /api/ai/smart-swap
 * ════════════════════════════════════════════
 *  Given an item the user buys, suggest cheaper
 *  alternatives with estimated savings.
 *
 *  🔒 Premium only
 *  Body: { item: string, budget?: number }
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requirePremium } from '../../middleware/require-premium';
import { db } from '../../lib/firebase';
import { generateAiResponse, logAiUsage } from '../../lib/gemini';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { SmartSwapPayload, SmartSwapResponse, DbUserProfile } from '../../types';

// ── System Prompt ─────────────────────────

const SYSTEM_PROMPT = `You are a friendly, supportive financial assistant for busy mums in the UK.
The user will give you a product or item they regularly buy. Your job is to suggest 3 cheaper alternatives ("smart swaps").

Rules:
- Be warm, encouraging, never judgmental
- Use UK pricing and UK store names (Aldi, Lidl, Tesco, Asda, etc.)
- Each swap should include the name, estimated saving, a short reason, and an emoji
- Include a total estimated weekly/monthly saving
- End with a practical money-saving tip

Respond in this exact JSON format:
{
  "original": "the item they mentioned",
  "swaps": [
    { "name": "Alternative name", "estimatedSaving": "£X.XX/week", "reason": "Short reason", "emoji": "🛒" }
  ],
  "totalEstimatedSaving": "£X.XX/month",
  "tip": "A practical tip"
}`;

// ── Mock Response (when Gemini is unavailable) ──

const MOCK_RESPONSE: SmartSwapResponse = {
  original: 'branded cereal',
  swaps: [
    { name: 'Aldi own-brand cereal', estimatedSaving: '£1.20/week', reason: 'Same quality, half the price', emoji: '🥣' },
    { name: 'Lidl Crownfield cereal', estimatedSaving: '£1.00/week', reason: 'Great taste, budget friendly', emoji: '⭐' },
    { name: 'Tesco own-brand cereal', estimatedSaving: '£0.80/week', reason: 'Easy to find, good value', emoji: '🛒' },
  ],
  totalEstimatedSaving: '£13.00/month',
  tip: 'Try buying cereal in bulk when it\'s on offer — it keeps for months!',
};

// ── Handler ───────────────────────────────

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'POST', res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requirePremium(user, res)) return;

  try {
    const body = req.body as SmartSwapPayload;

    if (!body?.item) {
      sendError(res, Errors.badRequest('item is required (e.g. "branded cereal")'));
      return;
    }

    // Fetch user profile for context
    const profileSnap = await db.collection('profiles').doc(user.id).get();
    const profile = profileSnap.exists ? (profileSnap.data() as DbUserProfile) : null;

    // Build the user prompt
    const budgetContext = body.budget ? `My weekly budget is £${body.budget}.` : '';
    const userPrompt = `I usually buy: ${body.item}. ${budgetContext} What are some cheaper alternatives?`;

    // Generate AI response
    const result = await generateAiResponse<SmartSwapResponse>({
      userId: user.id,
      endpoint: 'smart-swap',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      userProfile: profile,
      mockResponse: MOCK_RESPONSE,
    });

    await logAiUsage(user.id, 'smart-swap', false);

    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err);
  }
}
