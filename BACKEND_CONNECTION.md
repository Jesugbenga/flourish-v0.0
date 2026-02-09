# 🔧 Backend Connection Configuration

## Local Development Setup

When running the backend locally with Firebase Emulators, you need to configure the correct API URL in your frontend.

### Firebase Emulator URL Format

The Firebase Functions emulator uses this URL pattern:

```
http://127.0.0.1:5001/<PROJECT_ID>/us-central1/api
```

**Example:**
If your Firebase project ID is `flourish-5c2ad`, the URL is:

```
http://127.0.0.1:5001/flourish-5c2ad/us-central1/api
```

### Update Frontend .env

Edit `flourish/.env`:

```bash
# For Firebase Emulator (local development)
EXPO_PUBLIC_API_URL=http://127.0.0.1:5001/flourish-5c2ad/us-central1/api

# For production (after deploying)
# EXPO_PUBLIC_API_URL=https://us-central1-flourish-5c2ad.cloudfunctions.net/api
```

### How to Find Your Project ID

**Option 1:** Check your Firebase config in `flourish/.env`:

```bash
EXPO_PUBLIC_FIREBASE_PROJECT_ID=flourish-5c2ad
                                 ^^^^^^^^^^^^^^^^
                                 This is your project ID
```

**Option 2:** Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open your project
3. Project Settings → General → Project ID

**Option 3:** Run this command in the backend directory:

```bash
firebase projects:list
```

## Testing the Connection

### 1. Start Backend Emulator

```bash
cd backend
npm run serve
```

You should see:

```
✔  functions[us-central1-api]: http function initialized (http://127.0.0.1:5001/flourish-5c2ad/us-central1/api)
```

### 2. Test Health Endpoint

```bash
# Replace flourish-5c2ad with your actual project ID
curl http://127.0.0.1:5001/flourish-5c2ad/us-central1/api/health
```

Expected response:

```json
{
  "ok": true,
  "service": "flourish-api",
  "timestamp": "2026-02-08T17:30:00.000Z"
}
```

### 3. Start Frontend

```bash
cd flourish
npx expo start
```

The app should now be able to connect to your local backend!

## Common URL Mistakes

❌ **Wrong:**

```bash
EXPO_PUBLIC_API_URL=http://localhost:5001
EXPO_PUBLIC_API_URL=http://127.0.0.1:5001
EXPO_PUBLIC_API_URL=http://127.0.0.1:5001/api
```

✅ **Correct:**

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:5001/flourish-5c2ad/us-central1/api
```

## Production Deployment

After deploying to Firebase (`npm run deploy`), update frontend `.env`:

```bash
EXPO_PUBLIC_API_URL=https://us-central1-flourish-5c2ad.cloudfunctions.net/api
```

The URL format for production is:

```
https://us-central1-<PROJECT_ID>.cloudfunctions.net/api
```

## Troubleshooting

### "Network request failed" in app

1. **Check backend is running:**

   ```bash
   curl http://127.0.0.1:5001/<project-id>/us-central1/api/health
   ```

2. **Verify .env is loaded:**
   - Restart Expo dev server after changing `.env`
   - Check console logs for API_URL value

3. **Check Firebase project ID:**
   - Must match exactly
   - Case-sensitive

### "FIREBASE_SERVICE_ACCOUNT_KEY not set"

- Backend `.env` file missing or incomplete
- See [SETUP.md](./SETUP.md) for configuration guide

### 401 Unauthorized errors

- User must be signed in through Firebase Auth
- Frontend must send ID token in `Authorization: Bearer <token>` header
- Check auth-context is setting up token getter correctly

## Quick Reference

| Environment | API_URL |
|------------|---------|
| **Local Emulator** | `http://127.0.0.1:5001/<project-id>/us-central1/api` |
| **Production** | `https://us-central1-<project-id>.cloudfunctions.net/api` |
| **Mock Mode** | Not used (MOCK_MODE=true bypasses backend) |

## Additional Notes

- The `/api` prefix is part of the Express routing defined in `backend/index.ts`
- All endpoints start with `/api/` (e.g., `/api/user/init`, `/api/wins`)
- CORS is enabled for all origins in development
- Rate limiting for AI features: 20 requests/minute (configurable via `RATE_LIMIT_AI_RPM`)
