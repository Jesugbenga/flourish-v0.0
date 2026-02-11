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

// ── Helpers ─────────────────────────────────

function truncate(s: string, max = 200) {
  if (!s) return s;
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

function stripCodeFences(s: string) {
  return s.replace(/```[a-zA-Z]*\n?|```/g, '').trim();
}

function extractAndParseJSON(text: string): any {
  if (!text || typeof text !== 'string') return null;
  
  const cleaned = stripCodeFences(text).trim();
  
  // Try to find the first { character
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) {
    console.error('[extractAndParseJSON] No opening brace found. Text:', truncate(cleaned, 300));
    throw new Error(`No JSON object found in response. Snippet: ${truncate(cleaned, 200)}`);
  }

  // Find matching closing brace by tracking nesting depth.
  let depth = 0;
  for (let i = firstBrace; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = cleaned.slice(firstBrace, i + 1);
        try {
          const result = JSON.parse(candidate);
          console.log('[extractAndParseJSON] Successfully parsed JSON from position', firstBrace, 'to', i);
          return result;
        } catch (e) {
          console.error('[extractAndParseJSON] Brace-matched JSON failed to parse:', (e as Error).message);
          // Fall through to try fallback
          break;
        }
      }
    }
  }

  // Fallback: try to extract largest {..} block via regex (less safe but more forgiving)
  console.warn('[extractAndParseJSON] Brace matching failed, trying regex fallback');
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const result = JSON.parse(match[0]);
      console.log('[extractAndParseJSON] Successfully parsed via regex fallback');
      return result;
    } catch (e) {
      console.error('[extractAndParseJSON] Regex fallback also failed:', (e as Error).message);
      throw new Error(`JSON Parse error: ${(e as Error).message}. Snippet: ${truncate(cleaned, 300)}`);
    }
  }
  // Recovery attempt for truncated JSON: try to close unbalanced quotes and braces
  try {
    const candidate = cleaned.slice(firstBrace);
    let repaired = candidate;

    // If odd number of double quotes, close the open string
    const quoteCount = (repaired.match(/"/g) || []).length;
    if (quoteCount % 2 === 1) {
      repaired = repaired + '"';
      console.warn('[extractAndParseJSON] Repaired by closing odd quote');
    }

    // Balance braces by counting remaining opens
    const opens = (repaired.match(/\{/g) || []).length;
    const closes = (repaired.match(/\}/g) || []).length;
    const missing = opens - closes;
    if (missing > 0 && missing < 20) {
      repaired = repaired + '}'.repeat(missing);
      console.warn('[extractAndParseJSON] Appended', missing, 'closing brace(s) to repair JSON');
    }

    const result = JSON.parse(repaired);
    console.log('[extractAndParseJSON] Successfully repaired and parsed truncated JSON');
    return result;
  } catch (e) {
    console.error('[extractAndParseJSON] Recovery attempt failed:', (e as Error).message);
  }

  console.error('[extractAndParseJSON] No JSON block found at all. Full text:', truncate(cleaned, 500));
  throw new Error(`Unable to extract JSON from response. Snippet: ${truncate(cleaned, 300)}`);
}

// ── Sanitizers ─────────────────────────────────

function formatCurrency(input: string): string {
  if (!input || typeof input !== 'string') return '£0.00';
  const m = input.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (m) return `£${parseFloat(m[1]).toFixed(2)}`;
  const hasPound = input.includes('£');
  return hasPound ? input : '£0.00';
}

function extractFirstEmoji(s: string): string {
  if (!s || typeof s !== 'string') return '';
  const emojiMatch = s.match(/([\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
  return emojiMatch ? emojiMatch[0] : '';
}

function sanitizeSmartSwap(obj: any): SmartSwapResponse {
  const swaps = (obj.swaps || []).map((s: any) => ({
    name: (s.name || '').toString().trim(),
    estimatedSaving: formatCurrency((s.estimatedSaving || s.saving || '').toString()),
    reason: (s.reason || '').toString().trim(),
    emoji: extractFirstEmoji((s.emoji || '').toString()) || '🛒',
  }));

  return {
    original: (obj.original || '').toString().trim(),
    swaps,
    totalEstimatedSaving: formatCurrency((obj.totalEstimatedSaving || '').toString()),
    tip: (obj.tip || '').toString().trim(),
  };
}

function sanitizeMealPlan(obj: any): MealPlanResponse {
  const days = (obj.days || []).map((d: any) => {
    const mealsObj: Record<string, any> = {};
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    for (const t of mealTypes) {
      const m = (d.meals && d.meals[t]) || {};
      mealsObj[t] = {
        name: (m.name || '').toString().trim() || 'Simple meal',
        emoji: extractFirstEmoji((m.emoji || '').toString()) || '',
        estimatedCost: formatCurrency((m.estimatedCost || m.cost || '').toString()),
      };
    }
    return { day: (d.day || '').toString().trim() || 'Day', meals: mealsObj };
  });

  return {
    days,
    totalBudget: formatCurrency((obj.totalBudget || obj.total || '').toString()),
    tips: Array.isArray(obj.tips) ? obj.tips.map((t: any) => t.toString()) : [],
  };
}

// Try to recover a minimal smart-swap result from a truncated text
function recoverSmartSwapFromText(text: string): SmartSwapResponse | null {
  try {
    const cleaned = stripCodeFences(text);
    // extract original
    const origMatch = cleaned.match(/"original"\s*:\s*"([^"]*)/);
    const original = origMatch ? origMatch[1] : '';

    // find all occurrences of name fields even if truncated
    const nameRegex = /"name"\s*:\s*"([^"\n\r]*)/g;
    const swaps: any[] = [];
    let m;
    while ((m = nameRegex.exec(cleaned)) !== null && swaps.length < 5) {
      const name = m[1].trim();
      swaps.push({ name, estimatedSaving: '£0.00', reason: '', emoji: '🛒' });
    }

    if (swaps.length === 0) return null;

    return {
      original: original || '',
      swaps,
      totalEstimatedSaving: '£0.00',
      tip: '',
    };
  } catch (e) {
    return null;
  }
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

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

// ── Smart Swap Function ────────────────────

export interface SmartSwapPayload {
  item: string;
  budget?: number;
}

export interface SmartSwapResponse {
  original: string;
  swaps: Array<{
    name: string;
    estimatedSaving: string;
    reason: string;
    emoji: string;
  }>;
  totalEstimatedSaving: string;
  tip: string;
}

export async function smartSwapWithGemini(userId: string, payload: SmartSwapPayload): Promise<SmartSwapResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const rateCheck = await rateLimiter.canCall(userId);
  if (!rateCheck.allowed) throw new Error(rateCheck.error);

  const SWAP_PROMPT = `You are a friendly UK budget shopping assistant. The user buys: "${payload.item}".${payload.budget ? ` Their weekly budget is £${payload.budget}.` : ''}
Suggest 3 cheaper alternatives from UK stores (Aldi, Lidl, Tesco, Asda, etc.).
For each alternative, provide the estimated price per week (not just the savings), and a short reason. Respond ONLY with valid JSON (no markdown, no other text):
{
  "original": "the item they mentioned",
  "swaps": [
    { "name": "Alternative name", "alternativePrice": "£X.XX/week", "estimatedSaving": "£X.XX/week", "reason": "Short reason moms will understand", "emoji": "emoji" },
    { "name": "Alternative name 2", "alternativePrice": "£X.XX/week", "estimatedSaving": "£X.XX/week", "reason": "Short reason moms will understand", "emoji": "emoji" },
    { "name": "Alternative name 3", "alternativePrice": "£X.XX/week", "estimatedSaving": "£X.XX/week", "reason": "Short reason moms will understand", "emoji": "emoji" }
  ],
  "tip": "A practical tip for saving money on this item, written for busy moms."
}`;

  // Retry logic for transient server errors and recovery for truncated responses
  let lastText = '';
  let parsed: any = null;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: SWAP_PROMPT }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        // Retry on 5xx server errors
        if (status >= 500 && attempt < maxAttempts) {
          console.warn(`[smartSwap] HTTP ${status}, retrying attempt ${attempt + 1}/${maxAttempts}`);
          await delay(500 * attempt);
          continue;
        }
        throw new Error(`HTTP ${status}`);
      }

      const data = await response.json();
      lastText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      console.log('[smartSwap] Raw Gemini response:', lastText);

      parsed = extractAndParseJSON(lastText);
      // if parsing succeeded, break
      if (parsed) break;
    } catch (err) {
      // If parsing failed due to extraction, try to recover from partial text
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn('[smartSwap] Attempt error:', msg);
      // If we have partial text, try a lightweight recovery
      if (lastText) {
        const recovered = recoverSmartSwapFromText(lastText);
        if (recovered) {
          const sanitizedRecovered = sanitizeSmartSwap(recovered);
          return sanitizedRecovered as SmartSwapResponse;
        }
      }

      if (attempt < maxAttempts && (msg.startsWith('HTTP 5') || msg.includes('HTTP 503'))) {
        await delay(400 * attempt);
        continue;
      }

      console.error('[smartSwap] Error:', msg);
      throw new Error(msg);
    }
  }

  if (!parsed) {
    // final recovery attempt
    const recovered = lastText ? recoverSmartSwapFromText(lastText) : null;
    if (recovered) return sanitizeSmartSwap(recovered) as SmartSwapResponse;
    throw new Error(`Unable to extract JSON from response. Snippet: ${truncate(lastText, 300)}`);
  }

  if (!parsed || !parsed.swaps || !Array.isArray(parsed.swaps) || parsed.swaps.length === 0) {
    throw new Error(`Invalid response format: missing swaps array. Raw response: ${truncate(lastText, 400)}`);
  }

  return sanitizeSmartSwap(parsed) as SmartSwapResponse;
}

// ── Meal Plan Function ─────────────────────

export interface MealPlanPayload {
  days: number;
  budget: number;
  numPeople: number;
}

export interface MealPlanDay {
  day: string;
  meals: Record<string, { name: string; emoji: string; estimatedCost: string }>;
}

export interface MealPlanResponse {
  days: MealPlanDay[];
  totalBudget: string;
  tips: string[];
}

export async function mealPlanWithGemini(userId: string, payload: MealPlanPayload): Promise<MealPlanResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const rateCheck = await rateLimiter.canCall(userId);
  if (!rateCheck.allowed) throw new Error(rateCheck.error);

  const MEAL_PROMPT = `You are a friendly UK meal planning assistant for busy families on a budget.
Create a ${payload.days}-day meal plan for ${payload.numPeople} people with a budget of £${payload.budget}.
Use affordable UK ingredients from Aldi, Lidl, Tesco, Asda.
Each day must include breakfast, lunch, and dinner with emojis.
Keep meals simple, family-friendly, and budget-conscious.
Respond ONLY with valid JSON (no markdown, no other text). EXACTLY this structure:
{
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": { "name": "meal name", "emoji": "🍳", "estimatedCost": "£2.50" },
        "lunch": { "name": "meal name", "emoji": "🥪", "estimatedCost": "£3.00" },
        "dinner": { "name": "meal name", "emoji": "🍝", "estimatedCost": "£4.50" }
      }
    }
  ],
  "totalBudget": "£40.00",
  "tips": ["tip1", "tip2", "tip3"]
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: MEAL_PROMPT }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    console.log('[mealPlan] Raw Gemini response:', text);

    const parsed = extractAndParseJSON(text);

    if (!parsed || !parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      throw new Error(`Invalid response format: missing or empty days array. Raw response: ${truncate(text, 400)}`);
    }

    // Sanitize and normalize for UI
    const sanitized = sanitizeMealPlan(parsed);
    return sanitized as MealPlanResponse;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[mealPlan] Error:', msg);
    throw new Error(`Meal plan failed: ${msg}`);
  }
}
