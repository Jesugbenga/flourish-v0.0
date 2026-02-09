import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AppProvider } from '@/context/app-context';
import { AuthProvider, useAuthContext } from '@/context/auth-context';
import { Colors } from '@/constants/theme';
import { MOCK_MODE } from '@/lib/config';
import { useEffect } from 'react';

const FlourishTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.sage,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * InitGate — waits for auth to be ready, then routes the user:
 *   - Not signed in  →  /auth/sign-in
 *   - Onboarding needed  →  /onboarding
 *   - Ready  →  /
 */
function InitGate({ children }: { children: React.ReactNode }) {
  const { isReady, isSignedIn, onboardingComplete } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;

    // In mock mode, skip all auth routing
    if (MOCK_MODE) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/auth/sign-in' as any);
    } else if (isSignedIn && !onboardingComplete && !inOnboarding) {
      router.replace('/onboarding' as any);
    } else if (isSignedIn && onboardingComplete && (inAuthGroup || inOnboarding)) {
      router.replace('/' as any);
    }
  }, [isReady, isSignedIn, onboardingComplete, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.sage} />
      </View>
    );
  }

  return <>{children}</>;
}

/** Full navigation stack */
function AppNavigator() {
  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider value={FlourishTheme}>
          <InitGate>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: Colors.background },
                headerTintColor: Colors.text,
                headerTitleStyle: { fontWeight: '600', fontSize: 17 },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ title: 'Profile' }} />
              <Stack.Screen name="smart-swap" options={{ title: 'Smart Swap' }} />
              <Stack.Screen name="meal-planner" options={{ title: 'Meal Planner' }} />
              <Stack.Screen name="budget-tracker" options={{ title: 'Budget Tracker' }} />
              <Stack.Screen name="goal-calculator" options={{ title: 'Goal Calculator' }} />
              <Stack.Screen name="challenge" options={{ title: '7-Day Challenge' }} />
              <Stack.Screen name="community" options={{ title: 'Community' }} />
              <Stack.Screen name="lesson/[id]" options={{ title: 'Learn', headerBackTitle: 'Back' }} />
              <Stack.Screen name="rebeccas-corner" options={{ title: "Rebecca's Corner" }} />
              <Stack.Screen name="chat" options={{ title: 'Flo', headerBackTitle: 'Back' }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </InitGate>
          <StatusBar style="dark" />
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return <AppNavigator />;
}
