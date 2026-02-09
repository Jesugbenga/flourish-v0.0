# 🚀 Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- Firebase CLI installed: `npm install -g firebase-tools`

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

### 🔑 Firebase Service Account Key

**This is REQUIRED for the backend to work.**

1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project
2. Navigate to **Project Settings** (⚙️ icon) → **Service Accounts**
3. Click **"Generate new private key"** → Download the JSON file
4. **Stringify the JSON** (remove line breaks) and paste into `.env`:

```bash
# Example (use your actual credentials):
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"flourish-5c2ad","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"firebase-adminsdk-xyz@flourish-5c2ad.iam.gserviceaccount.com"}
```

**Note:** The entire JSON must be on one line. You can use this Node.js command to stringify it:

```bash
node -e "console.log(JSON.stringify(require('./path-to-service-account.json')))"
```

### 🤖 Google Gemini API Key

**Required for AI features (Smart Swap, Meal Plan, Goal Planning, Chat)**

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Paste into `.env`:

```bash
GEMINI_API_KEY=AIzaSy...your_key_here
```

### 💳 RevenueCat (Optional - for premium subscriptions)

If you're using RevenueCat for in-app purchases:

```bash
REVENUECAT_API_KEY=your_public_key
REVENUECAT_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**For hackathon/testing:** You can skip RevenueCat. The app has a manual premium toggle at `/api/admin/set-premium`.

## Step 3: Initialize Firebase

Login to Firebase CLI:

```bash
firebase login
```

Link your project:

```bash
firebase use --add
# Select your Firebase project ID
```

## Step 4: Local Development

### Option A: Firebase Emulators (Recommended)

Start the Firebase Functions emulator:

```bash
npm run serve
```

The API will be available at:

```
http://127.0.0.1:5001/<project-id>/us-central1/api
```

**Update frontend `.env`:**

```bash
# flourish/.env
EXPO_PUBLIC_API_URL=http://127.0.0.1:5001/<your-project-id>/us-central1/api
```

### Option B: Direct Node Server (For debugging)

If you need to debug the Express app directly without Firebase:

1. Create a temporary local server file `backend/local-server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Import your Express app setup from index.ts
import userInit from './api/user/init';
import userProfile from './api/user/profile';
// ... import all other routes

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Mount routes
app.post('/api/user/init', userInit);
app.get('/api/user/profile', userProfile);
app.put('/api/user/profile', userProfile);
// ... mount all routes

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
```

1. Run with:

```bash
npx ts-node local-server.ts
```

1. Update frontend:

```bash
EXPO_PUBLIC_API_URL=http://localhost:5001
```

## Step 5: Deploy to Production

Build and deploy:

```bash
npm run build
npm run deploy
```

Your API will be deployed to:

```
https://us-central1-<project-id>.cloudfunctions.net/api
```

**Update frontend `.env` for production:**

```bash
EXPO_PUBLIC_API_URL=https://us-central1-<your-project-id>.cloudfunctions.net/api
```

## 🔧 Troubleshooting

### Error: "Missing FIREBASE_SERVICE_ACCOUNT_KEY"

- Make sure you created `.env` from `.env.example`
- Verify the JSON is properly stringified (no line breaks)
- Check that the file is in the `backend/` directory

### Error: "Module not found" or import errors

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Firebase Emulator not starting

```bash
# Install/update Firebase tools
npm install -g firebase-tools@latest

# Re-initialize emulators
firebase init emulators
```

### API returns 401 Unauthorized

- Check that the frontend is sending the Firebase ID token in the `Authorization` header
- Verify the token is valid (not expired)
- Ensure the user exists in Firebase Authentication

### AI features not working

- Verify `GEMINI_API_KEY` is set correctly in `.env`
- Check your Gemini API quota at [Google AI Studio](https://aistudio.google.com)
- Review API rate limits (default: 20 RPM)

## 📋 Verification Checklist

Before running the backend, verify:

- [ ] `.env` file exists with `FIREBASE_SERVICE_ACCOUNT_KEY` set
- [ ] `GEMINI_API_KEY` is set (if using AI features)
- [ ] `npm install` completed successfully
- [ ] `npm run type-check` passes with 0 errors
- [ ] Firebase project is linked (`firebase use`)
- [ ] Frontend `.env` has correct `EXPO_PUBLIC_API_URL`

## 🎯 Testing the Backend

### Health Check

```bash
curl http://127.0.0.1:5001/<project-id>/us-central1/api/health
```

Expected response:

```json
{
  "ok": true,
  "service": "flourish-api",
  "timestamp": "2026-02-08T17:00:00.000Z"
}
```

### Test User Init (requires valid Firebase ID token)

```bash
curl -X POST http://127.0.0.1:5001/<project-id>/us-central1/api/user/init \
  -H "Authorization: Bearer <your-firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🔐 Security Notes

- **Never commit `.env` to git** — it contains sensitive credentials
- Service account keys have full admin access — keep them secret
- Use Firebase Security Rules for Firestore in production
- Enable CORS only for your frontend domain in production
- Rotate API keys regularly

## 📚 Additional Resources

- [Firebase Functions v2 docs](https://firebase.google.com/docs/functions)
- [Google Gemini API docs](https://ai.google.dev/docs)
- [Express.js docs](https://expressjs.com/)
- [Firestore docs](https://firebase.google.com/docs/firestore)
