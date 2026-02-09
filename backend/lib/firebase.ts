/**
 * ════════════════════════════════════════════
 *  Firebase Admin SDK (Server-Side)
 * ════════════════════════════════════════════
 *  Initialises Firebase Admin with a service
 *  account and exports Firestore + Auth.
 *
 *  This must NEVER be exposed to the frontend.
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    throw new Error(
      '[Firebase] Missing FIREBASE_SERVICE_ACCOUNT_KEY env var. ' +
      'Set it to the full JSON string of your Firebase service account key.'
    );
  }

  const serviceAccount = JSON.parse(raw);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/** Firestore database instance */
export const db = admin.firestore();

/** Firebase Auth instance */
export const auth = admin.auth();
