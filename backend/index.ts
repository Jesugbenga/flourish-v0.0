/**
 * ════════════════════════════════════════════
 *  Flourish Backend — Firebase Cloud Functions
 * ════════════════════════════════════════════
 *  Single Express app exported as a v2 Cloud
 *  Function. All routes are mounted here.
 *
 *  With v2, each function gets its own URL
 *  (no function-name prefix), so the Express
 *  routes include the /api prefix and the
 *  frontend can call them as-is.
 *
 *  URL pattern:
 *    https://<region>-<project>.cloudfunctions.net/api/user/init
 *    └──────────── API_URL ──────────────────┘ └── path ──┘
 */

import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';

// ── Import handlers ─────────────────────────

import userInit from './api/user/init';
import userProfile from './api/user/profile';
import winsIndex from './api/wins/index';
import winsSummary from './api/wins/summary';
import challengesIndex from './api/challenges/index';
import challengesStart from './api/challenges/start';
import challengesComplete from './api/challenges/complete';
import adminSetPremium from './api/admin/set-premium';
import aiSmartSwap from './api/ai/smart-swap';
import aiChat from './api/ai/chat';
import aiGoal from './api/ai/goal';
import aiMealPlan from './api/ai/meal-plan';

// ── Create Express App ──────────────────────

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// ── Mount routes ────────────────────────────

// User
app.post('/api/user/init', userInit);
app.get('/api/user/profile', userProfile);
app.put('/api/user/profile', userProfile);

// Wins
app.post('/api/wins', winsIndex);
app.get('/api/wins', winsIndex);
app.get('/api/wins/summary', winsSummary);

// Challenges
app.get('/api/challenges', challengesIndex);
app.post('/api/challenges/start', challengesStart);
app.post('/api/challenges/complete', challengesComplete);

// Admin (Hackathon only — for manually testing premium status)
app.post('/api/admin/set-premium', adminSetPremium);

// AI (Premium)
app.post('/api/ai/smart-swap', aiSmartSwap);
app.post('/api/ai/chat', aiChat);
app.post('/api/ai/goal', aiGoal);
app.post('/api/ai/meal-plan', aiMealPlan);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'flourish-api', timestamp: new Date().toISOString() });
});

// ── Export as Firebase Cloud Function (v2) ──

export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '256MiB',
    // Set secrets/env vars in Firebase Console or via firebase functions:secrets
  },
  app
);
