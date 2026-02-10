/**
 * ════════════════════════════════════════════
 *  POST /api/ai/meal-plan
 * ════════════════════════════════════════════
 *  Generate a budget-friendly meal plan with
 *  shopping list using Gemini AI.
 *
 *  🔒 Premium only
 *  Body: { days: number, budget: number, numPeople: number, dietaryPreferences?: string[] }
 */

import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { db } from '../../lib/firebase';
import { generateAiResponse, logAiUsage } from '../../lib/gemini';
import { sendSuccess, sendError, assertMethod, Errors } from '../../lib/errors';
import type { MealPlanPayload, MealPlanResponse, DbUserProfile } from '../../types';

// ── System Prompt ─────────────────────────

const SYSTEM_PROMPT = `You are a meal planning assistant for busy UK mums on a budget.
Generate a practical, family-friendly meal plan that's:
- Budget-conscious (use UK pricing and UK supermarket availability)
- Quick to prepare (most meals under 30 mins)
- Kid-friendly
- Nutritious but realistic
- Including a complete shopping list with estimated costs

Respond in this exact JSON format:
{
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": { "name": "Porridge with banana", "estimatedCost": "£0.50", "emoji": "🥣" },
        "lunch": { "name": "Cheese sandwich & apple", "estimatedCost": "£0.80", "emoji": "🥪" },
        "dinner": { "name": "Pasta with tomato sauce", "estimatedCost": "£1.50", "emoji": "🍝" },
        "snack": { "name": "Rice cakes", "estimatedCost": "£0.30", "emoji": "🍘" }
      }
    }
  ],
  "shoppingList": [
    { "item": "Porridge oats (1kg)", "estimatedCost": "£0.75" }
  ],
  "totalEstimatedCost": "£XX.XX",
  "tips": ["Batch cook pasta sauce on Sunday to save time midweek"]
}`;

// ── Mock Response ─────────────────────────

const MOCK_RESPONSE: MealPlanResponse = {
  days: [
    {
      day: 'Monday',
      meals: {
        breakfast: { name: 'Porridge with banana', estimatedCost: '£0.50', emoji: '🥣' },
        lunch: { name: 'Cheese toastie & apple', estimatedCost: '£0.80', emoji: '🧀' },
        dinner: { name: 'One-pot chicken pasta', estimatedCost: '£2.50', emoji: '🍝' },
        snack: { name: 'Carrot sticks & hummus', estimatedCost: '£0.40', emoji: '🥕' },
      },
    },
    {
      day: 'Tuesday',
      meals: {
        breakfast: { name: 'Toast with peanut butter', estimatedCost: '£0.35', emoji: '🍞' },
        lunch: { name: 'Leftover pasta', estimatedCost: '£0.00', emoji: '🍝' },
        dinner: { name: 'Veggie stir-fry with rice', estimatedCost: '£2.00', emoji: '🍜' },
        snack: { name: 'Banana', estimatedCost: '£0.15', emoji: '🍌' },
      },
    },
    {
      day: 'Wednesday',
      meals: {
        breakfast: { name: 'Cereal with milk', estimatedCost: '£0.40', emoji: '🥣' },
        lunch: { name: 'Beans on toast', estimatedCost: '£0.55', emoji: '🫘' },
        dinner: { name: 'Fish fingers, chips & peas', estimatedCost: '£2.20', emoji: '🐟' },
        snack: { name: 'Apple slices', estimatedCost: '£0.20', emoji: '🍎' },
      },
    },
  ],
  shoppingList: [
    { item: 'Porridge oats (1kg)', estimatedCost: '£0.75' },
    { item: 'Bananas (bunch of 5)', estimatedCost: '£0.65' },
    { item: 'Bread (800g)', estimatedCost: '£0.55' },
    { item: 'Chicken breast (500g)', estimatedCost: '£2.50' },
    { item: 'Pasta (500g)', estimatedCost: '£0.50' },
    { item: 'Tinned tomatoes x2', estimatedCost: '£0.70' },
    { item: 'Rice (1kg)', estimatedCost: '£0.45' },
    { item: 'Mixed veg (frozen)', estimatedCost: '£1.00' },
    { item: 'Fish fingers', estimatedCost: '£1.50' },
    { item: 'Oven chips', estimatedCost: '£1.00' },
  ],
  totalEstimatedCost: '£18.50',
  tips: [
    'Batch cook the pasta sauce — it freezes well for next week!',
    'Buy frozen veg instead of fresh to reduce waste.',
    'Check Aldi\'s Super 6 for cheap seasonal fruit & veg.',
  ],
};

// ── Handler ───────────────────────────────

export default async function handler(req: Request, res: Response) {
  if (!assertMethod(req.method, 'POST', res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const body = req.body as MealPlanPayload;

    // Validate
    const days = body?.days ?? 3;
    const budget = body?.budget ?? 30;
    const numPeople = body?.numPeople ?? 2;

    if (days < 1 || days > 7) {
      sendError(res, Errors.badRequest('days must be between 1 and 7'));
      return;
    }

    // Fetch user profile for dietary context
    const profileSnap = await db.collection('profiles').doc(user.id).get();
    const profile = profileSnap.exists ? (profileSnap.data() as DbUserProfile) : null;

    // Build prompt
    const dietaryStr = body.dietaryPreferences?.length
      ? `Dietary preferences: ${body.dietaryPreferences.join(', ')}.`
      : '';

    const userPrompt = `Create a ${days}-day meal plan for ${numPeople} people with a budget of £${budget}. ${dietaryStr}`;

    const result = await generateAiResponse<MealPlanResponse>({
      userId: user.id,
      endpoint: 'meal-plan',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      userProfile: profile,
      mockResponse: MOCK_RESPONSE,
    });

    await logAiUsage(user.id, 'meal-plan', false);

    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err);
  }
}
