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
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Card } from '@/components/ui/card';

const presetGoals = [
  { label: 'Emergency Fund', icon: 'shield-checkmark' as const, amount: 1000 },
  { label: 'Family Holiday', icon: 'airplane' as const, amount: 2000 },
  { label: 'New Car Fund', icon: 'car' as const, amount: 5000 },
  { label: 'Kids Education', icon: 'school' as const, amount: 3000 },
];

export default function GoalCalculatorScreen() {
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [months, setMonths] = useState('');
  const [calculated, setCalculated] = useState(false);

  const target = parseFloat(targetAmount) || 0;
  const timeframe = parseInt(months) || 1;
  const weeklyGoal = target / (timeframe * 4.33);
  const dailySaving = weeklyGoal / 7;

  const handlePreset = (preset: (typeof presetGoals)[0]) => {
    setGoalTitle(preset.label);
    setTargetAmount(preset.amount.toString());
    setMonths('12');
    setCalculated(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Set a goal and we'll break it down into small, achievable steps.
        </Text>

        {/* Presets */}
        <Text style={styles.sectionTitle}>Popular goals</Text>
        <View style={styles.presetsGrid}>
          {presetGoals.map((preset) => (
            <Card
              key={preset.label}
              style={styles.presetCard}
              onPress={() => handlePreset(preset)}
            >
              <Ionicons name={preset.icon} size={22} color={Colors.sage} />
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <Text style={styles.presetAmount}>
                £{preset.amount.toLocaleString()}
              </Text>
            </Card>
          ))}
        </View>

        {/* Input Form */}
        <Text style={styles.sectionTitle}>Your goal</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>What are you saving for?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Family holiday"
            placeholderTextColor={Colors.textMuted}
            value={goalTitle}
            onChangeText={setGoalTitle}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.md }]}>
            <Text style={styles.inputLabel}>Target amount</Text>
            <View style={styles.currencyInput}>
              <Text style={styles.currency}>£</Text>
              <TextInput
                style={[styles.input, styles.inputFlat]}
                placeholder="2000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Timeframe</Text>
            <View style={styles.currencyInput}>
              <TextInput
                style={[styles.input, styles.inputFlat]}
                placeholder="12"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={months}
                onChangeText={setMonths}
              />
              <Text style={styles.currency}>months</Text>
            </View>
          </View>
        </View>

        <FlourishButton
          title="Calculate my plan"
          onPress={() => setCalculated(true)}
          fullWidth
          disabled={!goalTitle || !targetAmount || !months}
          style={{ marginBottom: Spacing.lg }}
        />

        {/* Results */}
        {calculated && target > 0 && (
          <View style={styles.resultCard}>
            <View style={styles.resultIcon}>
              <Ionicons name="flag" size={24} color={Colors.sageDark} />
            </View>
            <Text style={styles.resultTitle}>{goalTitle}</Text>
            <Text style={styles.resultTarget}>
              £{target.toLocaleString()} in {timeframe} months
            </Text>

            <ProgressBar progress={0} style={{ marginVertical: Spacing.lg }} height={10} />

            <View style={styles.resultGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultItemValue}>£{weeklyGoal.toFixed(2)}</Text>
                <Text style={styles.resultItemLabel}>per week</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultItemValue}>£{dailySaving.toFixed(2)}</Text>
                <Text style={styles.resultItemLabel}>per day</Text>
              </View>
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="bulb" size={16} color={Colors.gold} />
              <Text style={styles.tipText}>
                That's about{' '}
                {dailySaving < 3
                  ? 'one coffee'
                  : dailySaving < 8
                    ? 'one takeaway meal'
                    : 'a small treat'}{' '}
                a day. You've got this! 🌱
              </Text>
            </View>

            <View style={styles.suggestions}>
              <Text style={styles.suggestionsTitle}>Small habits that help</Text>
              <View style={styles.suggestionRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.sage} />
                <Text style={styles.suggestionText}>Use Smart Swap to save £5–10/week</Text>
              </View>
              <View style={styles.suggestionRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.sage} />
                <Text style={styles.suggestionText}>Meal plan to save £15–25/week</Text>
              </View>
              <View style={styles.suggestionRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.sage} />
                <Text style={styles.suggestionText}>Complete the 7-day challenge</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.title3, color: Colors.text, marginBottom: Spacing.md },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  presetCard: { width: '47%', alignItems: 'flex-start' as const, padding: Spacing.md },
  presetLabel: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  presetAmount: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: {
    ...Typography.subhead,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  inputFlat: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  inputRow: { flexDirection: 'row' },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  currency: { ...Typography.body, color: Colors.textSecondary },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.medium,
    alignItems: 'center',
  },
  resultIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  resultTitle: { ...Typography.title2, color: Colors.text },
  resultTarget: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  resultGrid: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  resultItem: { alignItems: 'center' },
  resultItemValue: { ...Typography.title1, color: Colors.sage },
  resultItemLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 4 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.goldLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  tipText: { ...Typography.subhead, color: Colors.text, flex: 1, lineHeight: 22 },
  suggestions: { width: '100%' },
  suggestionsTitle: { ...Typography.headline, color: Colors.text, marginBottom: Spacing.md },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  suggestionText: { ...Typography.body, color: Colors.textSecondary },
});
