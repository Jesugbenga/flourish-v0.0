/**
 * ════════════════════════════════════════════
 *  Gemini Client — Direct API Calls
 * ════════════════════════════════════════════
 *  Direct calls to Google Gemini API with:
 *  - Rate limiting (prevent abuse)
 *  - User context injection
 *  - Error handling
 *
 *  API Key: EXPO_PUBLIC_GEMINI_API_KEY
 *  Docs: https://ai.google.dev/docs/
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// Rate limiting: max 10 calls per 60 seconds per user
const RATE_LIMIT = { max: 10, windowSeconds: 60 };
const RATE_LIMIT_KEY = 'gemini_rate_limit';

export interface GeminiChatPayload {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userContext?: {
    totalSaved?: number;
    monthlyBudget?: number;
    streakDays?: number;
    recentWins?: Array<{ title: string; amountSaved: number }>;
  };
}

export interface GeminiChatResponse {
  reply: string;
  suggestedActions?: string[];
}

// ── Rate Limiter ──────────────────────────

class RateLimiter {
  private timestamps: number[] = [];

  async canCall(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const now = Date.now();
    const windowMs = RATE_LIMIT.windowSeconds * 1000;

    // Load stored timestamps
    const stored = await AsyncStorage.getItem(`${RATE_LIMIT_KEY}:${userId}`);
    this.timestamps = stored ? JSON.parse(stored) : [];

    // Remove old timestamps outside the window
    this.timestamps = this.timestamps.filter((ts) => now - ts < windowMs);

    if (this.timestamps.length >= RATE_LIMIT.max) {
      return {
        allowed: false,
        error: `Rate limit reached. Max ${RATE_LIMIT.max} messages per ${RATE_LIMIT.windowSeconds}s. Try again later.`,
      };
    }

    // Add current timestamp
    this.timestamps.push(now);
    await AsyncStorage.setItem(`${RATE_LIMIT_KEY}:${userId}`, JSON.stringify(this.timestamps));

    return { allowed: true };
  }
}

const rateLimiter = new RateLimiter();

// ── System Prompt ──────────────────────────

const SYSTEM_PROMPT = `You are "Flo", the Flourish AI assistant — a warm, supportive, and financial friend for busy moms.

Reply style requirements (strict):
- Keep responses short, direct, and free of filler or fluff.
- Prefer 1–3 sentences for typical answers; only expand when the user explicitly asks for more.
- Use plain, everyday language and act like a friendly, practical advisor.
- If a short list of steps helps, present 3 concise bullets (no long paragraphs).

Your personality:
- Calm, encouraging, and non-judgmental
- Speak like a supportive friend, not a banker
- Use emojis sparingly but warmly
- Celebrate small wins 🎉

Your expertise:
- Everyday budgeting & saving for UK families
- Smart shopping & meal planning on a budget
- Basic investing (ISAs, pensions) — educational only
- Money mindset & reducing financial anxiety
- Kid-related expenses & family finances

Rules:
- NEVER give specific investment advice (suggest chatting to a financial adviser)
- NEVER be condescending
- If asked outside your scope, gently redirect
- Reference UK-specific products/services
- Keep it warm and relatable`;

// ── Chat Function ──────────────────────────

export async function chatWithGemini(userId: string, payload: GeminiChatPayload): Promise<GeminiChatResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured (EXPO_PUBLIC_GEMINI_API_KEY)');
  }

  // Check rate limit
  const rateCheck = await rateLimiter.canCall(userId);
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.error);
  }

  // Build user context string (avoid nested templates)
  let recentWinsStr = '';
  if (payload.userContext?.recentWins?.length) {
    recentWinsStr = `- Recent Wins: ${payload.userContext.recentWins.map((w) => `${w.title} (£${w.amountSaved})`).join(', ')}`;
  }

  const contextStr = payload.userContext
    ? [
        'User Context:',
        `- Total Saved: £${payload.userContext.totalSaved?.toFixed(2) ?? '0.00'}`,
        `- Monthly Budget: £${payload.userContext.monthlyBudget?.toFixed(2) ?? 'Not set'}`,
        `- Saving Streak: ${payload.userContext.streakDays ?? 0} days`,
        recentWinsStr,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  // Build conversation history
  const history = (payload.conversationHistory ?? []).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Build the full prompt
  const fullPrompt = `${SYSTEM_PROMPT}

${contextStr}

User Message: ${payload.message}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          ...history.slice(-4), // Last 4 messages for context
          { role: 'user', parts: [{ text: fullPrompt }] },
        ],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          // Increase token budget so longer replies are returned
          maxOutputTokens: 1500,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      const detail = err.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini API error: ${detail}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I did not understand that.';

    return { reply, suggestedActions: [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Chat failed: ${msg}`);
  }
}
