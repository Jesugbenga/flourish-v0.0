// Load environment variables from .env into process.env at build time
require('dotenv').config();

module.exports = ({ config }) => {
  return {
    ...config,
    owner: 'jesugbenga',
    slug: 'flourish',
    name: 'Flourish',
    version: '1.0.0',
    scheme: 'flourish',
    description: 'Flourish — simple savings, meal planning and challenges',

    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/flourish-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#FAF9F6',
          dark: {
            backgroundColor: '#1A1D1E',
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    newArchEnabled: true,

    extra: {
      // EAS project id (used by EAS to associate builds)
      projectId: process.env.EAS_PROJECT_ID || 'ad017e0e-239d-488f-8e30-6be401a05cae',

      // Public Firebase keys (embed safe-to-expose values at build-time)
      EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || null,
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || null,
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || null,
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || null,
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || null,
      EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || null,

      // Public third-party keys
      EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID || null,
      EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID || null,
      EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID || null,

      EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || null,

      // Public RevenueCat keys
      EXPO_PUBLIC_REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || null,
    

      // Router / EAS metadata
      router: {},
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'ad017e0e-239d-488f-8e30-6be401a05cae',
      },
    },

    icon: './assets/images/flourish-icon.png',

    adaptiveIcon: {
      foregroundImage: './assets/images/flourish-icon.png',
      backgroundColor: '#D4E7D9',
    },

    splash: {
      image: './assets/images/flourish-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FAF9F6',
      dark: {
        backgroundColor: '#1A1D1E',
      },
    },

    ios: {
      bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'com.company.flourish',
      buildNumber: process.env.IOS_BUILD_NUMBER || '1',
      supportsTablet: true,
    },

    android: {
      package: process.env.ANDROID_PACKAGE || 'com.company.flourish',
      versionCode: 17,
      adaptiveIcon: {
        foregroundImage: './assets/images/flourish-icon.png',
        backgroundColor: '#D4E7D9',
      },
    },

    web: {
      output: 'static',
      favicon: './assets/images/flourish-icon.png',
    },
  };
};
