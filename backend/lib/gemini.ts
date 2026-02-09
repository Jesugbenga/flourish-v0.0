/**
 * ════════════════════════════════════════════
 *  Google Gemini AI Integration
 * ════════════════════════════════════════════
 *  Wraps the Gemini SDK with:
 *  - Structured JSON output
 *  - Response caching (Firestore aiCache collection)
 *  - Graceful mock fallbacks
 *  - User-context injection
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash } from 'crypto';
import { db } from './firebase';
import type { DbUserProfile, AiEndpoint } from '../types';

// ── Gemini Client ─────────────────────────

let _genAI: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI | null {
  if (_genAI) return _genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'REPLACE_ME') {
    console.warn('[Gemini] No API key configured — will use mock responses');
    return null;
  }

  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

/** Check if Gemini is available (has a valid key) */
export function isGeminiAvailable(): boolean {
  return getGemini() !== null;
}

// ── Cache Layer ───────────────────────────

const CACHE_TTL: Record<AiEndpoint, number> = {
  'smart-swap': 24 * 60 * 60 * 1000,  // 24 hours
  'meal-plan':  12 * 60 * 60 * 1000,  // 12 hours
  'goal':       48 * 60 * 60 * 1000,  // 48 hours
  'chat':        1 * 60 * 60 * 1000,  //  1 hour
};

/**
 * Generate a hash for a prompt to use as cache key.
 */
function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

/**
 * Check the Firestore aiCache collection for a cached response.
 */
async function getCachedResponse(
  userId: string,
  endpoint: AiEndpoint,
  promptHash: string
): Promise<Record<string, unknown> | null> {
  try {
    const snap = await db
      .collection('aiCache')
      .where('user_id', '==', userId)
      .where('endpoint', '==', endpoint)
      .where('prompt_hash', '==', promptHash)
      .where('expires_at', '>', new Date().toISOString())
      .orderBy('expires_at', 'desc')
      .limit(1)
      .get();

    if (snap.empty) return null;
    return (snap.docs[0].data().response as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

/**
 * Store a response in the Firestore aiCache collection.
 */
async function cacheResponse(
  userId: string,
  endpoint: AiEndpoint,
  promptHash: string,
  response: unknown
): Promise<void> {
  try {
    const ttl = CACHE_TTL[endpoint];
    const expiresAt = new Date(Date.now() + ttl).toISOString();

    await db.collection('aiCache').add({
      user_id: userId,
      endpoint,
      prompt_hash: promptHash,
      response,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Gemini] Failed to cache response:', err);
  }
}

// ── User Context Builder ──────────────────

/**
 * Build a user-context string for the Gemini prompt.
 * Includes kids, budget, savings — whatever is relevant.
 */
export function buildUserContext(profile: DbUserProfile | null): string {
  if (!profile) return 'No profile data available.';

  const parts: string[] = [];

  if (profile.display_name) parts.push(`Name: ${profile.display_name}`);
  if (profile.num_kids) parts.push(`Number of kids: ${profile.num_kids}`);
  if (profile.kids_ages?.length) parts.push(`Kids ages: ${profile.kids_ages.join(', ')}`);
  if (profile.monthly_income) parts.push(`Monthly income: £${profile.monthly_income}`);
  if (profile.monthly_budget) parts.push(`Monthly budget: £${profile.monthly_budget}`);
  if (profile.savings_goal) parts.push(`Savings goal: £${profile.savings_goal}`);
  if (profile.savings_goal_label) parts.push(`Goal: ${profile.savings_goal_label}`);
  if (profile.dietary_preferences?.length) {
    parts.push(`Dietary preferences: ${profile.dietary_preferences.join(', ')}`);
  }

  return parts.length > 0
    ? `User context:\n${parts.join('\n')}`
    : 'No detailed profile data available.';
}

// ── Core Generation Function ──────────────

interface GenerateOptions {
  userId: string;
  endpoint: AiEndpoint;
  systemPrompt: string;
  userPrompt: string;
  userProfile?: DbUserProfile | null;
  skipCache?: boolean;
  mockResponse: unknown;
}

/**
 * The main entry point for AI generation.
 *
 * 1. Check cache
 * 2. Call Gemini (with structured JSON output)
 * 3. Cache the result
 * 4. Fall back to mock if Gemini is unavailable
 */
export async function generateAiResponse<T>(
  options: GenerateOptions
): Promise<T> {
  const {
    userId,
    endpoint,
    systemPrompt,
    userPrompt,
    userProfile,
    skipCache = false,
    mockResponse,
  } = options;

  // Build full prompt with user context
  const contextStr = buildUserContext(userProfile ?? null);
  const fullPrompt = `${systemPrompt}\n\n${contextStr}\n\nUser request:\n${userPrompt}`;
  const promptHash = hashPrompt(fullPrompt);

  // ① Check cache (unless skipped)
  if (!skipCache) {
    const cached = await getCachedResponse(userId, endpoint, promptHash);
    if (cached) {
      console.log(`[Gemini] Cache HIT for ${endpoint}`);
      return cached as T;
    }
  }

  // ② Try Gemini
  const genAI = getGemini();
  if (!genAI) {
    console.log(`[Gemini] No API key — returning mock for ${endpoint}`);
    return mockResponse as T;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    // Parse the JSON response
    const parsed = JSON.parse(text) as T;

    // ③ Cache the response
    await cacheResponse(userId, endpoint, promptHash, parsed);

    console.log(`[Gemini] Fresh response for ${endpoint}`);
    return parsed;
  } catch (err) {
    console.error(`[Gemini] Generation failed for ${endpoint}:`, err);
    // ④ Graceful fallback to mock
    console.log(`[Gemini] Falling back to mock response for ${endpoint}`);
    return mockResponse as T;
  }
}

// ── Log AI Usage ──────────────────────────

/**
 * Log an AI usage event to the Firestore activityLog subcollection.
 */
export async function logAiUsage(
  userId: string,
  endpoint: AiEndpoint,
  cached: boolean
): Promise<void> {
  try {
    await db.collection('users').doc(userId).collection('activityLog').add({
      action: 'ai_used',
      metadata: { endpoint, cached },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Gemini] Failed to log AI usage:', err);
  }
}
