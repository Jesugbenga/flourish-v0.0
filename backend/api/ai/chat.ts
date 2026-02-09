/**
 * ════════════════════════════════════════════
 *  POST /api/ai/chat
 * ════════════════════════════════════════════
 *  Context-aware AI chatbot. Pulls the user's
 *  profile, wins, and budget data to give
 *  personalised, calm financial guidance.
 *
 *  🔒 Premium only
 *  Body: { message: string, conversationHistory?: Array<{role, content}> }
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requirePremium } from '../../middleware/require-premium';
import { db } from '../../lib/firebase';
import { generateAiResponse, logAiUsage, buildUserContext } from '../../lib/gemini';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { ChatPayload, ChatResponse, DbUserProfile } from '../../types';

// ── System Prompt ─────────────────────────

const SYSTEM_PROMPT = `You are "Flo", the Flourish AI assistant — a warm, supportive, and knowledgeable financial friend for busy UK mums.

Your personality:
- Calm, encouraging, and never judgmental
- You speak like a supportive friend, not a bank manager
- You use emojis sparingly but warmly
- You keep answers concise (2-4 paragraphs max)
- You celebrate small wins

Your expertise:
- Everyday budgeting and saving tips for UK families
- Smart shopping and meal planning on a budget
- Basic investing concepts (ISAs, pensions, index funds) — educational only
- Money mindset and reducing financial anxiety
- Kid-related expenses and family finances

Rules:
- NEVER give specific investment advice (say "I'd suggest chatting to a financial adviser for specifics")
- NEVER be condescending about someone's financial situation
- Always relate to the user's actual data when available
- If asked about something outside your scope, gently redirect
- Reference UK-specific products, stores, and financial instruments

Respond in this exact JSON format:
{
  "reply": "Your conversational response here",
  "suggestedActions": ["Optional follow-up action 1", "Optional follow-up action 2"]
}`;

// ── Mock Response ─────────────────────────

const MOCK_RESPONSE: ChatResponse = {
  reply: 'That\'s such a great question! 💚 Starting to save doesn\'t have to be complicated. Even putting away £5 a week adds up to over £250 a year — that\'s a lovely family day out! \n\nA simple way to start is the "spare change" method: round up everything you spend to the nearest pound, and pop the difference into a savings pot. Most banking apps can do this automatically.\n\nYou\'re already doing amazing by thinking about this. Want me to help you set a specific savings goal?',
  suggestedActions: [
    'Set a savings goal',
    'Try a no-spend challenge',
    'See smart swap suggestions',
  ],
};

// ── Handler ───────────────────────────────

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'POST', res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;
  if (!requirePremium(user, res)) return;

  try {
    const body = req.body as ChatPayload;

    if (!body?.message?.trim()) {
      sendError(res, Errors.badRequest('message is required'));
      return;
    }

    // ── Gather rich user context ──────────
    // Profile
    const profileSnap = await db.collection('profiles').doc(user.id).get();
    const profile = profileSnap.exists ? (profileSnap.data() as DbUserProfile) : null;

    // Recent wins (last 5)
    const winsSnap = await db
      .collection('users').doc(user.id).collection('wins')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();
    const recentWins = winsSnap.docs.map(d => d.data());

    // User stats
    const userSnap = await db.collection('users').doc(user.id).get();
    const userData = userSnap.data();

    // Budget summary (this month)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const budgetSnap = await db
      .collection('users').doc(user.id).collection('budgetEntries')
      .where('date', '>=', monthStart)
      .get();
    const budgetEntries = budgetSnap.docs.map(d => d.data());

    const monthIncome = budgetEntries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const monthExpenses = budgetEntries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // ── Build enriched context ────────────
    const profileContext = buildUserContext(profile);
    const winsContext = recentWins.length
      ? `Recent wins: ${recentWins.map((w: any) => `${w.title} (£${w.amount_saved})`).join(', ')}`
      : 'No wins logged yet.';
    const statsContext = userData
      ? `Total savings: £${userData.total_savings}. Streak: ${userData.streak_days} days.`
      : '';
    const budgetContext = budgetEntries.length
      ? `This month: £${monthIncome} income, £${monthExpenses} spent.`
      : '';

    // ── Build conversation prompt ─────────
    const history = body.conversationHistory ?? [];
    const historyStr = history
      .map(h => `${h.role === 'user' ? 'Mum' : 'Flo'}: ${h.content}`)
      .join('\n');

    const enrichedPrompt = [
      SYSTEM_PROMPT,
      '',
      profileContext,
      statsContext,
      winsContext,
      budgetContext,
      '',
      historyStr ? `Previous conversation:\n${historyStr}\n` : '',
      `Mum: ${body.message}`,
    ].filter(Boolean).join('\n');

    const result = await generateAiResponse<ChatResponse>({
      userId: user.id,
      endpoint: 'chat',
      systemPrompt: enrichedPrompt,
      userPrompt: body.message,
      userProfile: profile,
      skipCache: true,  // Chat should always be fresh
      mockResponse: MOCK_RESPONSE,
    });

    await logAiUsage(user.id, 'chat', false);

    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err);
  }
}
