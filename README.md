
🌷 Flourish — Technical Documentation

1️⃣ High-Level Architecture Overview

Flourish is built using a modern, server-validated architecture designed for security, subscription enforcement, and AI-powered personalization. The system favors server-side validation for auth, subscriptions, and AI usage to prevent client-side spoofing and ensure predictable behavior across devices.

Tech Stack
- Frontend: React Native (Expo) + TypeScript + Expo Router
- Auth: Firebase Authentication (ID tokens)
- Subscriptions: RevenueCat (client SDK + server webhooks)
- Backend: Firebase (Firestore + Cloud Functions) — this repo contains a Firebase backend in `backend/`
- AI: Google Gemini (server-side calls)

System Architecture (logical)

Client (Expo app)
   • Uses Firebase Auth for sign-in, stores session JWT
   • Calls server endpoints for protected actions
   • Uses RevenueCat SDK for in-app purchase flow
         ↓
Auth & Server Validation Layer (Cloud Functions / serverless)
   • Verifies Firebase ID token for each request (using Firebase Admin SDK)
   • Verifies entitlement via RevenueCat webhooks / Firestore
   • Forwards structured prompts to Gemini and returns JSON
         ↓
Database (Postgres / Firestore)
   • Stores users, subscription state, wins, goals

This pattern enforces that all premium features and AI usage are validated and audited server-side.

🔐 Authentication Flow
- User signs in with Firebase Authentication in the client (email/password, social providers, or anonymous).
- Firebase issues an ID token; the client includes the token in API requests (Authorization: Bearer <idToken>).
- Cloud Functions verify the ID token via the Firebase Admin SDK before processing requests.
- Any premium gated action requires server-side subscription verification (check Firestore `subscription_status`).

2️⃣ AI Architecture

All AI-related features (Smart Swap, Meal Planner, Goal Calculator, AI Chat) are executed server-side (Cloud Functions) to centralize API keys and enforce subscription checks.

AI request flow:
- Client submits a structured request to an Edge Function.
- The function verifies auth and subscription status.
- The function composes a structured prompt and calls the Gemini API.
- Gemini returns structured JSON which the function validates, persists (if needed), and returns to the client.

We enforce JSON-only responses with schema checks to prevent hallucinated formats and simplify frontend rendering.

Database & Data Model (simplified — Firestore)

- users
   - id
   - firebase_uid
   - email
   - subscription_status (active | expired | canceled | billing_issue)
   - created_at

- quick_wins
   - id, user_id, title, amount_saved, created_at

- goals
   - id, user_id, target_amount, monthly_contribution, projected_date

- challenges / userChallenges
   - per-user instances to persist 7-day challenge completion

Subscription state is the single source of truth in Firestore and is updated via RevenueCat webhooks processed by Cloud Functions.

4️⃣ RevenueCat Integration & Monetization Setup

Overview
Flourish uses RevenueCat to manage cross-platform subscriptions, entitlement abstraction, and secure server-side receipt validation. Webhooks are consumed by a Firebase Cloud Function which updates Firestore.

Subscription flow
1) Client Purchase
   - The client uses the RevenueCat SDK to fetch offerings and trigger purchases.
   - The SDK returns purchaser info which the client can use immediately for UI gating.

2) Webhook Sync
   - RevenueCat sends webhook events (purchase, renewal, cancellation, billing issues) to a server endpoint.
   - Webhook handler verifies the signature and updates the user's `subscription_status` in the DB.

3) Server Enforcement
   - Every premium API route verifies the Firebase ID token, then reads `subscription_status` from Firestore.
   - If not `active`, the API returns 403. This prevents client-side spoofing.

Monetization tiers (example)
- Free: limited swaps/day, basic budgeting
- Premium: unlimited AI features, advanced analytics
- Pricing examples: £4.99/month, £49.99/year (managed in RevenueCat)

Why RevenueCat?
- Cross-platform reconciliation, webhook delivery, entitlement abstraction, analytics dashboard, and reduced platform-specific billing complexity.

Server-side webhook & helper code
- Webhook endpoint example: [backend/api/webhooks/revenuecat.ts](backend/api/webhooks/revenuecat.ts) (handled by Firebase Cloud Function / Express handler)
- Server helper: [backend/revenuecat.ts](backend/revenuecat.ts)
- Middleware protecting premium routes: [backend/middleware/require-premium.ts](backend/middleware/require-premium.ts)

Security & Secrets
- Store `REVENUECAT_WEBHOOK_SECRET` and `REVENUECAT_API_KEY` server-side (do NOT embed in the client).
- For Cloud Functions / Firebase deploys, store secrets via `functions.config()` (or use Secret Manager) and expose only safe runtime config to the client.
- Use EAS secrets or CI secret storage for client build-time values; never include server secrets in `app.config.js`.

5️⃣ Dev / Testing / QA

- Sandbox purchases: use RevenueCat sandbox and Play Console / TestFlight testers.
- End-to-end test: make a sandbox purchase → confirm RevenueCat dashboard → confirm webhook delivery → confirm DB update → sign out/in to ensure entitlement persists.
- Webhook debugging: use RevenueCat logs and server logs; ensure signature verification matches `REVENUECAT_WEBHOOK_SECRET`.

6️⃣ Deployment & Env Notes

- Build-time env: use `app.config.js` (or `expo` dynamic config) to inject safe runtime values for the client. Do NOT include server secrets.
- Server secrets: store in your deployment environment (Firebase Functions config / Secret Manager, or CI/EAS secrets).
- Cloud Functions deploy: use `firebase deploy --only functions` or CI pipelines with `firebase-tools`.
- EAS builds: run from the project root where `package.json` exists.

7️⃣ Scalability & Operations

- Stateless Edge Functions for scale; Postgres/Firestore as persistent store.
- Rate-limit AI calls per user and enforce quotas server-side.
- Reconciliation: schedule periodic syncs with RevenueCat's subscriber API for missed webhook events.

8️⃣ Code References (quick links)
- Webhooks: [backend/api/webhooks/revenuecat.ts](backend/api/webhooks/revenuecat.ts)
- RevenueCat helper: [backend/revenuecat.ts](backend/revenuecat.ts)
- Auth middleware: [backend/middleware/require-auth.ts](backend/middleware/require-auth.ts)
- Premium middleware: [backend/middleware/require-premium.ts](backend/middleware/require-premium.ts)
- Client paywall UI: [flourish/app/paywall.tsx](flourish/app/paywall.tsx)
- Challenge persistence: [flourish/context/app-context.tsx](flourish/context/app-context.tsx)

9️⃣ Quick Setup Checklist
- Create products in App Store / Play Console.
- Configure those products and entitlements in RevenueCat.
- Add `REVENUECAT_API_KEY` and `REVENUECAT_WEBHOOK_SECRET` to server env/EAS secrets.
- Point RevenueCat webhook to `https://<your-backend>/api/webhooks/revenuecat`.
- Test in sandbox and verify DB updates and cross-device persistence.

🔚 Summary

Flourish combines secure auth, server-side subscription validation (RevenueCat + Edge Functions), and AI-driven features (Gemini) in a scalable serverless architecture. The server is the source of truth for subscription state and AI access, ensuring consistent, secure behavior across platforms.


## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| **Frontend**   | React Native / Expo SDK 54, Expo Router |
| **Auth**       | Firebase Authentication (Google + Apple) |
| **Database**   | Cloud Firestore (NoSQL)                 |
| **Backend**    | Cloud Functions (TypeScript) |
| **AI**         | Google Gemini 3 Flash                 |
| **Payments**   | RevenueCat (in-app subscriptions)       |

---

## Getting Started

**📚 Quick Links:**
- [Backend Setup Guide](./backend/SETUP.md) - Detailed backend configuration
- [Backend Connection Guide](./BACKEND_CONNECTION.md) - API URL configuration for local/production

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Enable Authentication:**
   - Go to **Build → Authentication → Sign-in method**
   - Enable **Google** (this auto-creates OAuth client IDs in Google Cloud)
   - Enable **Apple** (requires Apple Developer account configuration)
3. **Enable Firestore:**
   - Go to **Build → Firestore Database**
   - Create a database (start in **test mode** for development)

### 2. Get Your Firebase Credentials

#### Backend (Service Account Key)

1. Go to **Project Settings → Service Accounts**
2. Click **"Generate new private key"** — this downloads a JSON file
3. Copy the JSON contents into `backend/.env` as `FIREBASE_SERVICE_ACCOUNT_KEY` (single line)

#### Frontend (Web App Config)

1. Go to **Project Settings → General → Your apps**
2. Click **Add app → Web** (or select existing)
3. Copy the config values into `flourish/.env`:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`

#### Google Sign-In Client IDs

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. You'll see OAuth client IDs auto-created by Firebase:
   - **Web client** → put in `EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID` (required)
   - **iOS client** → put in `EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID` (optional, for native builds)
   - **Android client** → put in `EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID` (optional, for native builds)

### 3. Set Up Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in FIREBASE_SERVICE_ACCOUNT_KEY, GEMINI_API_KEY, REVENUECAT_* keys

# Frontend
# Edit flourish/.env with your Firebase web config values
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd flourish
npm install
```


### 5. Run Locally

```bash
# Backend (Firebase emulator)
cd backend
npm run serve

# Frontend (Expo)
cd flourish
npx expo start
```

---

## Firestore Data Structure

```
users/{firebaseUID}
  ├── email, has_premium, premium_plan, revenuecat_id
  ├── streak_days, total_savings, created_at, updated_at
  ├── wins/{winId}            — title, amount_saved, category, emoji
  ├── userChallenges/{ucId}   — challenge_id, status, progress
  ├── activityLog/{logId}     — action, metadata
  └── budgetEntries/{entryId} — category, amount, type, date

profiles/{firebaseUID}
  └── display_name, num_kids, kids_ages, monthly_income, monthly_budget,
      savings_goal, onboarding_complete, dietary_preferences, ...

challenges/{challengeId}     — (shared) title, description, is_premium, ...

aiCache/{cacheId}            — user_id, endpoint, prompt_hash, response, expires_at
```

---


## Deploying Backend

To deploy backend functions to Firebase:

```bash
firebase deploy --only functions
```

---

## RevenueCat Setup

1. Create an app in [RevenueCat](https://app.revenuecat.com)
2. Set the **App User ID** to the Firebase UID (this is done automatically by the frontend)
3. Add a webhook pointing to your Firebase Cloud Function endpoint, e.g. `https://us-central1-<project-id>.cloudfunctions.net/api/webhooks/revenuecat`
4. Copy the webhook secret into `REVENUECAT_WEBHOOK_SECRET`
5. **Android paywall:** RevenueCat uses different public API keys per platform. In the RevenueCat dashboard go to **Project → API Keys** and copy the **Google (Android) Public API Key**. In `flourish/.env` set `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` to that value. Without it, the paywall will show "Loading plans…" forever on Android. Use `EXPO_PUBLIC_REVENUECAT_API_KEY` for iOS (Apple public key).

---

## Gemini AI Setup

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add it as `GEMINI_API_KEY` in your backend `.env`
3. The AI endpoints (smart-swap, meal-plan, goal, chat) will use Gemini automatically
4. If no key is set, mock responses are returned instead
