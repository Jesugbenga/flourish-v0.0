# 🌱 Flourish

Flourish is a mobile app that helps busy mums save money daily and learn bite-size investing — simple tips, meal-costing, "smart swaps" and 5-minute investment lessons.

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| **Frontend**   | React Native / Expo SDK 54, Expo Router |
| **Auth**       | Firebase Authentication (Google + Apple) |
| **Database**   | Cloud Firestore (NoSQL)                 |
| **Backend**    | Vercel Serverless Functions (TypeScript) |
| **AI**         | Google Gemini 1.5 Flash                 |
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
# Backend (Vercel dev server)
cd backend
npx vercel dev

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

## Deploying to Vercel

1. Push your code to GitHub
2. Import the `backend/` folder in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (the full JSON string)
   - `GEMINI_API_KEY`
   - `REVENUECAT_API_KEY`
   - `REVENUECAT_WEBHOOK_SECRET`
4. Deploy!

---

## RevenueCat Setup

1. Create an app in [RevenueCat](https://app.revenuecat.com)
2. Set the **App User ID** to the Firebase UID (this is done automatically by the frontend)
3. Add a webhook pointing to `https://your-vercel-url.vercel.app/api/webhooks/revenuecat`
4. Copy the webhook secret into `REVENUECAT_WEBHOOK_SECRET`

---

## Gemini AI Setup

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add it as `GEMINI_API_KEY` in your backend `.env`
3. The AI endpoints (smart-swap, meal-plan, goal, chat) will use Gemini automatically
4. If no key is set, mock responses are returned instead
