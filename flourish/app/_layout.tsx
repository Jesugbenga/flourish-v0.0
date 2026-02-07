import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppProvider } from '@/context/app-context';
import { Colors } from '@/constants/theme';

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

export default function RootLayout() {
  return (
    <AppProvider>
      <ThemeProvider value={FlourishTheme}>
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
          <Stack.Screen name="smart-swap" options={{ title: 'Smart Swap' }} />
          <Stack.Screen name="meal-planner" options={{ title: 'Meal Planner' }} />
          <Stack.Screen name="budget-tracker" options={{ title: 'Budget Tracker' }} />
          <Stack.Screen name="goal-calculator" options={{ title: 'Goal Calculator' }} />
          <Stack.Screen name="challenge" options={{ title: '7-Day Challenge' }} />
          <Stack.Screen name="community" options={{ title: 'Community' }} />
          <Stack.Screen name="lesson/[id]" options={{ title: 'Learn', headerBackTitle: 'Back' }} />
          <Stack.Screen name="rebeccas-corner" options={{ title: "Rebecca's Corner" }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AppProvider>
  );
}
