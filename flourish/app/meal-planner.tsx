import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';
import { useApp } from '@/context/app-context';
import { useAuthContext } from '@/context/auth-context';
import { canAccess } from '@/lib/feature-gate';
import { api, type MealPlanResponse } from '@/lib/api';
import { MOCK_MODE } from '@/lib/config';
import { mealPlans } from '@/data/mock-data';

export default function MealPlannerScreen() {
  const { addWin } = useApp();
  const { wins } = useApp();
  const { hasPremium } = useAuthContext();
  const router = useRouter();

  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [addedMeals, setAddedMeals] = useState<Set<string>>(new Set());
  const [aiPlan, setAiPlan] = useState<MealPlanResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const gated = !canAccess('meal-planner', hasPremium);

  const totalCost = mealPlans.reduce((sum, m) => sum + m.costPerServing * 4, 0);
  const totalSavings = mealPlans.reduce((sum, m) => sum + m.savingsVsTakeout, 0);

  const handleGenerateAiPlan = async () => {
    if (gated) { router.push('/paywall'); return; }
    setAiLoading(true);
    try {
      const result = await api.mealPlan({ days: 5, budget: 40, numPeople: 3 });
      setAiPlan(result);
    } catch {
      // Keep local meals
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddMeal = (meal: (typeof mealPlans)[0]) => {
    if (addedMeals.has(meal.id)) return;
    setAddedMeals((prev) => new Set([...prev, meal.id]));
    addWin({
      id: Date.now().toString(),
      type: 'meal',
      description: `Planned: ${meal.name}`,
      amount: meal.savingsVsTakeout,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const isMealAdded = (mealId: string, mealName?: string) => {
    if (addedMeals.has(mealId)) return true;
    if (mealName && wins.some((w) => w.type === 'meal' && w.description.includes(mealName))) return true;
    return false;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Quick meals that save money and reduce decision fatigue.
      </Text>

      {/* AI Generate Button */}
      {!MOCK_MODE && (
        <FlourishButton
          title={aiLoading ? 'Generating plan…' : '✨ Generate AI Meal Plan'}
          onPress={handleGenerateAiPlan}
          fullWidth
          variant={gated ? 'outline' : 'primary'}
          disabled={aiLoading}
          icon={gated ? 'lock-closed' : 'sparkles'}
          style={{ marginBottom: Spacing.lg }}
        />
      )}

      {/* AI Loading */}
      {aiLoading && (
        <View style={{ alignItems: 'center', padding: Spacing.lg }}>
          <ActivityIndicator color={Colors.sage} />
          <Text style={{ ...Typography.subhead, color: Colors.textSecondary, marginTop: Spacing.sm }}>
            Creating your personalised meal plan…
          </Text>
        </View>
      )}

      {/* AI Meal Plan Results */}
      {aiPlan && (
        <View style={{ marginBottom: Spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md }}>
            <Ionicons name="sparkles" size={16} color={Colors.sage} />
            <Text style={{ ...Typography.headline, color: Colors.text }}>Your AI Meal Plan</Text>
          </View>
          {aiPlan.days.map((day, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(400)}>
              <View style={styles.mealCard}>
                <Text style={styles.mealName}>{day.day}</Text>
                {Object.entries(day.meals).map(([type, meal]) => (
                  <View key={type} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ ...Typography.subhead, color: Colors.text, textTransform: 'capitalize' }}>
                      {meal.emoji} {type}: {meal.name}
                    </Text>
                    <Text style={{ ...Typography.caption1, color: Colors.textSecondary }}>{meal.estimatedCost}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ))}
          {aiPlan.tips.length > 0 && (
            <View style={{ backgroundColor: Colors.sageLight, padding: Spacing.md, borderRadius: BorderRadius.md }}>
              {aiPlan.tips.map((tip, i) => (
                <Text key={i} style={{ ...Typography.caption1, color: Colors.sageDark, marginBottom: 4 }}>
                  💡 {tip}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{mealPlans.length}</Text>
          <Text style={styles.summaryLabel}>Meals</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>~£{totalCost.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Total Cost</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.sage }]}>
            £{totalSavings.toFixed(0)}
          </Text>
          <Text style={styles.summaryLabel}>vs Takeout</Text>
        </View>
      </View>

      {/* Meal Cards */}
      {mealPlans.map((meal, index) => (
        <Animated.View
          key={meal.id}
          entering={FadeInDown.delay(index * 100).duration(400)}
        >
          <TouchableOpacity
            style={styles.mealCard}
            activeOpacity={0.8}
            onPress={() =>
              setExpandedMeal(expandedMeal === meal.id ? null : meal.id)
            }
          >
            <View style={styles.mealHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <View style={styles.mealMeta}>
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{meal.prepTime}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="cash-outline" size={12} color={Colors.sage} />
                    <Text style={[styles.metaText, { color: Colors.sage }]}>
                      £{meal.costPerServing.toFixed(2)}/serving
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>
                  Save £{meal.savingsVsTakeout.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {meal.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Expanded Content */}
            {expandedMeal === meal.id && (
              <View style={styles.expandedContent}>
                <Text style={styles.expandedTitle}>Ingredients</Text>
                {meal.ingredients.map((ing, i) => (
                  <Text key={i} style={styles.ingredientText}>
                    • {ing}
                  </Text>
                ))}

                <Text style={[styles.expandedTitle, { marginTop: Spacing.md }]}>Steps</Text>
                {meal.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}

                <View style={styles.whySaves}>
                  <Ionicons name="leaf" size={14} color={Colors.sageDark} />
                  <Text style={styles.whySavesText}>
                    This saves £{meal.savingsVsTakeout.toFixed(2)} compared to a similar takeaway.
                  </Text>
                </View>

                <FlourishButton
                  title={isMealAdded(meal.id, meal.name) ? 'Added to plan ✓' : 'Add to my plan'}
                  onPress={() => handleAddMeal(meal)}
                  variant={isMealAdded(meal.id, meal.name) ? 'secondary' : 'primary'}
                  fullWidth
                  disabled={isMealAdded(meal.id, meal.name)}
                />
              </View>
            )}

            {expandedMeal !== meal.id && (
              <View style={styles.expandHint}>
                <Text style={styles.expandHintText}>Tap to see recipe</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { ...Typography.title2, color: Colors.text },
  summaryLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  mealCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  mealName: { ...Typography.headline, color: Colors.text, marginBottom: Spacing.sm },
  mealMeta: { flexDirection: 'row', gap: Spacing.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption1, color: Colors.textSecondary },
  saveBadge: {
    backgroundColor: Colors.sageLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  saveBadgeText: { ...Typography.caption1, fontWeight: '600', color: Colors.sageDark },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagText: { ...Typography.caption2, color: Colors.textSecondary, fontWeight: '500' },
  expandedContent: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
  },
  expandedTitle: { ...Typography.headline, color: Colors.text, marginBottom: Spacing.sm },
  ingredientText: { ...Typography.body, color: Colors.textSecondary, marginBottom: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  stepNumberText: { ...Typography.caption2, fontWeight: '600', color: Colors.sageDark },
  stepText: { ...Typography.body, color: Colors.text, flex: 1 },
  whySaves: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.sageLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
  },
  whySavesText: { ...Typography.caption1, color: Colors.sageDark, flex: 1 },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  expandHintText: { ...Typography.caption1, color: Colors.textMuted },
});
