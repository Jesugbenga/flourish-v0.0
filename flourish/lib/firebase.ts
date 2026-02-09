/**
 * ════════════════════════════════════════════
 *  Firebase JS SDK — Client-Side
 * ════════════════════════════════════════════
 *  Initialises the Firebase web SDK for use in
 *  the Expo React Native app (works in Expo Go).
 *
 *  Note: getReactNativePersistence was removed in Firebase JS SDK v11.
 *  browserLocalPersistence works in Expo Go because Expo provides
 *  web-compatible storage. The "Auth without AsyncStorage" warning
 *  is a known false positive and can be safely ignored.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** Singleton Firebase app */
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/** Firebase Auth with automatic persistence via AsyncStorage (when installed) */
export const firebaseAuth: Auth = getAuth(firebaseApp);

/** Firebase Firestore database */
export const db: Firestore = getFirestore(firebaseApp);
