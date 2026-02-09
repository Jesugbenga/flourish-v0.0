# 🌿 Flourish Backend

> **A production-ready backend for Flourish** — a calm, modern financial companion app for mums.

Built with **TypeScript** on **Firebase Cloud Functions (v2)** with **Express**, backed by **Firestore**, **Firebase Auth**, **RevenueCat** (subscriptions), and **Google Gemini** (AI).

---

## 📐 Architecture Overview

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  React Native │────▶│  Firebase Cloud      │────▶│  Firestore   │
│  (Expo) App   │     │  Functions (Express) │     │  (NoSQL DB)  │
└──────────────┘     └────────┬────┬────┬───┘     └──────────────┘
                              │    │    │
                     ┌────────┘    │    └────────┐
                     ▼             ▼             ▼
               ┌──────────┐ ┌──────────┐ ┌──────────────┐
               │ Firebase  │ │  Gemini  │ │  RevenueCat  │
               │  (Auth)   │ │  (AI)    │ │  (Payments)  │
               └──────────┘ └──────────┘ └──────────────┘
```

### Request Flow

1. **Mobile app** sends request with Firebase ID token in `Authorization: Bearer <token>` header
2. **`requireAuth` middleware** verifies the token via Firebase Admin SDK
3. **User resolution** — looks up or auto-creates the user in Firestore by `uid`
4. **Premium check** (if needed) — `requirePremium` gates paid features
5. **Business logic** runs, touches Firestore / Gemini as needed
6. **Consistent JSON response** via `sendSuccess()` / `sendError()`

---

## 📁 Project Structure

```
backend/
├── index.ts                    # Express app → Firebase Cloud Function (v2)
├── api/                        # Route handlers
│   ├── user/
│   │   ├── init.ts             # POST — create user on first app open
│   │   └── profile.ts          # GET / PUT — read & update profile
│   ├── wins/
│   │   ├── index.ts            # POST — log a win  |  GET — list wins
│   │   └── summary.ts          # GET — aggregated wins summary
│   ├── challenges/
│   │   ├── index.ts            # GET — list all challenges
│   │   ├── start.ts            # POST — start a challenge
│   │   └── complete.ts         # POST — mark challenge complete
│   ├── ai/
│   │   ├── smart-swap.ts       # POST — cheaper alternatives (Premium)
│   │   ├── meal-plan.ts        # POST — budget meal plan (Premium)
│   │   ├── goal.ts             # POST — savings goal calculator (Premium)
│   │   └── chat.ts             # POST — AI chatbot "Flo" (Premium)
│   └── webhooks/
│       └── revenuecat.ts       # POST — subscription lifecycle events
├── lib/                        # Shared utilities
│   ├── firebase.ts             # Firebase Admin SDK initialisation
│   ├── revenuecat.ts           # Subscription logic + webhook verification
│   ├── gemini.ts               # Gemini AI with Firestore caching + fallbacks
│   └── errors.ts               # Error handling + response helpers
├── middleware/
│   ├── require-auth.ts         # Authenticate every request (Firebase ID token)
│   └── require-premium.ts      # Gate premium features
├── types/
│   └── index.ts                # TypeScript type definitions
├── .env.example                # Template for environment variables
├── package.json
├── tsconfig.json
└── README.md                   # ← You are here
```

---

## 🔐 Authentication (Firebase)

### How It Works

1. **Frontend** authenticates the user via Firebase JS SDK (Google / Apple sign-in)
2. Frontend gets a **Firebase ID token** from the signed-in user
3. Every API request includes: `Authorization: Bearer <firebase_id_token>`
4. Backend **verifies the ID token** using `firebase-admin` → `auth.verifyIdToken()`
5. The `uid` claim identifies the user
6. We look up / auto-create the user in Firestore

### Security

- Firebase **service account key** never leaves the server
- ID token verification happens on **every request** (no trust-the-client)
- Users are auto-created on first auth if they don't exist yet

### Adding Real Keys

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → go to **Project Settings** → **Service accounts**
3. Click **Generate new private key** → download the JSON file
4. Stringify the JSON and set it as `FIREBASE_SERVICE_ACCOUNT_KEY` in your `.env`

---

## 💳 Subscriptions (RevenueCat)

### Plans

| Plan | Price | Product ID |
|------|-------|------------|
| Free | £0 | — |
| Premium Monthly | £4.99/mo | `flourish_premium_monthly` |
| Premium Annual | £49.99/yr | `flourish_premium_annual` |

### Premium-Gated Features

- ✅ Unlimited Smart Swaps
- ✅ AI Meal Planner
- ✅ Goal-based savings calculator
- ✅ AI chatbot ("Flo")
- ✅ Full challenges
- ✅ Community posting
- ✅ Full investing lessons

### How It Works

1. User purchases via **RevenueCat** in the mobile app
2. RevenueCat sends a **webhook** to `POST /api/webhooks/revenuecat`
3. Backend verifies the webhook signature (HMAC-SHA256)
4. Updates `has_premium` and `premium_plan` in the Firestore `users` document
5. Frontend checks premium status via `GET /api/user/profile`

### Enabling Webhooks

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com) → Project Settings → Webhooks
2. Set the URL to: `https://<region>-<project-id>.cloudfunctions.net/api/webhooks/revenuecat`
3. Copy the **webhook signing secret** → set as `REVENUECAT_WEBHOOK_SECRET` in `.env`

### Events Handled

| Event | Action |
|-------|--------|
| `INITIAL_PURCHASE` | Grant premium |
| `RENEWAL` | Grant premium |
| `UNCANCELLATION` | Grant premium |
| `PRODUCT_CHANGE` | Grant premium (new plan) |
| `EXPIRATION` | Revoke premium |
| `CANCELLATION` | Revoke premium |
| `BILLING_ISSUE` | Revoke premium |

---

## 🤖 AI Integration (Gemini)

### Endpoints

| Endpoint | Description | Premium? |
|----------|-------------|----------|
| `POST /api/ai/smart-swap` | Cheaper alternatives for items | ✅ |
| `POST /api/ai/meal-plan` | Budget meal plans with shopping list | ✅ |
| `POST /api/ai/goal` | Savings goal strategy & milestones | ✅ |
| `POST /api/ai/chat` | Context-aware chatbot "Flo" | ✅ |

### How It Works

1. Each endpoint has a **carefully crafted system prompt** with:
   - UK-specific context (stores, pricing, financial products)
   - Warm, non-judgmental tone
   - Structured JSON output format
2. **User context injection** — the user's profile (kids, budget, savings, dietary prefs) is included in every prompt
3. **Response caching** — results are cached in the Firestore `aiCache` collection with configurable TTLs
4. **Graceful fallbacks** — if the Gemini API key is missing or the call fails, realistic mock responses are returned

### Cache TTLs

| Endpoint | TTL |
|----------|-----|
| Smart Swap | 24 hours |
| Meal Plan | 12 hours |
| Goal Calculator | 48 hours |
| Chat | 1 hour |

### AI Chatbot ("Flo")

The chat endpoint gathers rich context before each response:

- User profile (kids, budget, goals)
- Recent wins (last 5)
- Total savings & streak
- This month's budget summary
- Conversation history (sent by frontend)

### Adding the Gemini Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Set `GEMINI_API_KEY` in your `.env`

---

## 🗄️ Database (Firestore)

### Collections

| Collection | Purpose |
|------------|---------|
| `users/{uid}` | Core identity, linked to Firebase Auth |
| `profiles/{uid}` | Personalisation (kids, budget, goals, dietary prefs) |
| `users/{uid}/wins` | Daily savings & achievements (subcollection) |
| `challenges/{id}` | System-defined challenges (seeded) |
| `users/{uid}/userChallenges` | User's challenge progress (subcollection) |
| `users/{uid}/budgetEntries` | Income & expense tracking (subcollection) |
| `users/{uid}/activityLog` | Analytics & engagement events (subcollection) |
| `aiCache/{id}` | Cached Gemini AI responses |

### Setting Up

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open your project → **Firestore Database** → **Create database**
3. Choose **production mode** (or test mode for development)
4. Select a region close to your users (e.g. `europe-west2` for UK)

### Seeding Challenges

Firestore doesn't have a schema file. Add challenge documents to the `challenges` collection. Each document should have:

```json
{
  "title": "No-Spend Day",
  "description": "Go a full day without spending any money.",
  "category": "budget",
  "difficulty": "easy",
  "estimated_savings": 15,
  "duration_days": 1,
  "is_premium": false,
  "sort_order": 1
}
```

### Security Notes

- The backend uses the **Firebase Admin SDK** (bypasses Firestore security rules)
- Firestore security rules should still be configured as a safety net
- The service account key is **NEVER** exposed to the frontend

---

## 🚀 Deployment

### Prerequisites

- Node.js ≥ 18
- [Firebase CLI](https://firebase.google.com/docs/cli) installed (`npm i -g firebase-tools`)
- A Firebase project with Firestore and Authentication enabled

### Local Development

```bash
cd backend
npm install
cp .env.example .env
# Fill in your keys in .env

# Start Firebase Emulators (Functions + Firestore + Auth)
npm run serve
# → Functions: http://localhost:5001/<project>/us-central1/api
# → Emulator UI: http://localhost:4000
```

### Deploy to Firebase

```bash
# Login to Firebase
firebase login

# Set your project ID (in .firebaserc or via CLI)
firebase use your-project-id

# Set environment config / secrets
firebase functions:secrets:set FIREBASE_SERVICE_ACCOUNT_KEY
firebase functions:secrets:set REVENUECAT_API_KEY
firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET
firebase functions:secrets:set GEMINI_API_KEY

# Deploy
npm run deploy
# → https://us-central1-<project-id>.cloudfunctions.net/api
```

### Frontend API_URL

After deploying, update the frontend environment variable:

```
EXPO_PUBLIC_API_URL=https://us-central1-<project-id>.cloudfunctions.net
```

The frontend calls paths like `/api/user/init`, which map to the Cloud Function named `api` at that path.

---

## 🧪 What's Mocked vs Real

| Component | Status | Notes |
|-----------|--------|-------|
| Firebase Auth | 🟢 Real | Just add your service account key |
| Firestore DB | 🟢 Real | Enable Firestore, add service account key |
| RevenueCat | 🟡 Webhook-ready | Mock verification in dev (no secret = skip) |
| Gemini AI | 🟡 Real + Mock | Falls back to mock if no API key |
| Rate Limiting | 🔴 Not yet | Placeholder for future |

### Mock Behaviour

- **No Gemini key?** → All AI endpoints return realistic, hardcoded mock responses
- **No RevenueCat secret?** → Webhook signature verification is skipped (dev mode)
- **No RevenueCat API key?** → `getSubscriberStatus()` returns `{ hasPremium: false }`

---

## 📡 API Reference

### Standard Response Format

All endpoints return:

```json
{
  "ok": true,
  "data": { ... }
}
```

Or on error:

```json
{
  "ok": false,
  "error": "Human-friendly error message"
}
```

### Endpoints

#### User

| Method | Path | Auth | Premium | Description |
|--------|------|------|---------|-------------|
| POST | `/api/user/init` | ✅ | — | Create user on first open |
| GET | `/api/user/profile` | ✅ | — | Get profile + subscription status |
| PUT | `/api/user/profile` | ✅ | — | Update profile fields |

#### Wins & Progress

| Method | Path | Auth | Premium | Description |
|--------|------|------|---------|-------------|
| POST | `/api/wins` | ✅ | — | Log a new win |
| GET | `/api/wins` | ✅ | — | List wins (paginated) |
| GET | `/api/wins/summary` | ✅ | — | Aggregated stats |

#### Challenges

| Method | Path | Auth | Premium | Description |
|--------|------|------|---------|-------------|
| GET | `/api/challenges` | ✅ | — | List all (premium ones marked as locked) |
| POST | `/api/challenges/start` | ✅ | Varies | Start a challenge |
| POST | `/api/challenges/complete` | ✅ | — | Complete a challenge |

#### AI (All Premium)

| Method | Path | Auth | Premium | Description |
|--------|------|------|---------|-------------|
| POST | `/api/ai/smart-swap` | ✅ | ✅ | Cheaper alternatives |
| POST | `/api/ai/meal-plan` | ✅ | ✅ | Budget meal plan + shopping list |
| POST | `/api/ai/goal` | ✅ | ✅ | Savings goal strategy |
| POST | `/api/ai/chat` | ✅ | ✅ | Context-aware chatbot |

#### Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/revenuecat` | Signature | Subscription lifecycle events |

---

## 🔒 Security Checklist

- [x] All API keys are in environment variables (never in code)
- [x] Firebase ID tokens verified on every request
- [x] Service account key never exposed to frontend
- [x] RevenueCat webhook signature verification
- [x] Users can only access their own data
- [x] Premium features gated server-side
- [x] `.env` is gitignored
- [x] `.env.example` provided with placeholder values

---

## 📱 Frontend Integration

The React Native frontend at `flourish/` is fully wired to this backend:

| Integration | Files |
|---|---|
| **API Client** | `flourish/lib/api.ts` — typed fetch wrapper with Firebase ID token |
| **Config** | `flourish/lib/config.ts` — `API_URL`, `MOCK_MODE`, Firebase / RevenueCat keys |
| **Feature Gate** | `flourish/lib/feature-gate.ts` — `canAccess(feature, hasPremium)` |
| **Auth Context** | `flourish/context/auth-context.tsx` — Firebase Auth + RevenueCat + backend init |
| **App Context** | `flourish/context/app-context.tsx` — backend sync with mock fallback |
| **Auth Screens** | `flourish/app/auth/sign-in.tsx`, `flourish/app/onboarding.tsx` |
| **Profile** | `flourish/app/profile.tsx` — connected to `GET/PUT /api/user/profile` |
| **AI Screens** | Smart Swap, Meal Planner, Goal Calculator — call backend AI endpoints |
| **Paywall** | `flourish/app/paywall.tsx` — RevenueCat purchase flow |
| **Wins** | Pull-to-refresh syncs from `GET /api/wins` |

**Mock mode** (`EXPO_PUBLIC_MOCK_MODE=true`) keeps the app fully functional offline using local mock data — perfect for demos or development without a deployed backend.

---

<p align="center">
  Built with 💚 for the Flourish team
</p>
