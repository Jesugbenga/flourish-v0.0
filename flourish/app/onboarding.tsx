/**
 * Onboarding screen — collects basic profile info
 * before the user enters the main app.
 */

import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';
import { useAuthContext } from '@/context/auth-context';
import { api } from '@/lib/api';
import { MOCK_MODE } from '@/lib/config';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboardingComplete, displayName } = useAuthContext();

  const [name, setName] = useState(displayName ?? '');
  const [numKids, setNumKids] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (!MOCK_MODE) {
        await api.updateProfile({
          displayName: name || undefined,
          numKids: numKids ? parseInt(numKids, 10) : undefined,
          monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : undefined,
          savingsGoal: savingsGoal ? parseFloat(savingsGoal) : undefined,
        });
      }
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('[Onboarding] Save failed:', err);
      // Proceed anyway — backend will catch up
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="leaf" size={32} color={Colors.sageDark} />
            </View>
            <Text style={styles.title}>Welcome to Flourish 🌱</Text>
            <Text style={styles.subtitle}>
              Tell us a little about yourself so we can personalise your experience.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Your first name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rebecca"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>How many kids?</Text>
            <TextInput
              style={styles.input}
              value={numKids}
              onChangeText={setNumKids}
              placeholder="e.g. 2"
              keyboardType="number-pad"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Monthly budget (£)</Text>
            <TextInput
              style={styles.input}
              value={monthlyBudget}
              onChangeText={setMonthlyBudget}
              placeholder="e.g. 1200"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Savings goal (£)</Text>
            <TextInput
              style={styles.input}
              value={savingsGoal}
              onChangeText={setSavingsGoal}
              placeholder="e.g. 500"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <FlourishButton
            title={saving ? 'Saving…' : "Let's go!"}
            onPress={handleFinish}
            fullWidth
            size="lg"
            disabled={saving}
          />

          <Text style={styles.skipText} onPress={handleFinish}>
            Skip for now
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.largeTitle, color: Colors.text, textAlign: 'center' },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  form: { marginBottom: Spacing.xl },
  label: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.text,
  },
  skipText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    textDecorationLine: 'underline',
  },
});
