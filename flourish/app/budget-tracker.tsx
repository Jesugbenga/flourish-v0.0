import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useApp } from '@/context/app-context';

export default function BudgetTrackerScreen() {
  const { budget } = useApp();

  const totalAllocated = budget.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = budget.reduce((sum, c) => sum + c.spent, 0);
  const remaining = totalAllocated - totalSpent;

  const getStatusColor = (spent: number, allocated: number) => {
    const ratio = spent / allocated;
    if (ratio > 0.95) return Colors.danger;
    if (ratio > 0.8) return '#D4A843';
    return Colors.sage;
  };

  const getStatusText = (spent: number, allocated: number) => {
    const ratio = spent / allocated;
    if (ratio > 0.95) return 'Could be optimised';
    if (ratio > 0.8) return 'Getting close';
    return 'In safe zone';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        See where your money goes — no judgement, just awareness.
      </Text>

      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overviewLabel}>Monthly Budget</Text>
            <Text style={styles.overviewAmount}>£{totalAllocated.toFixed(0)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.overviewLabel}>Remaining</Text>
            <Text style={[styles.overviewAmount, { color: Colors.sage }]}>
              £{remaining.toFixed(0)}
            </Text>
          </View>
        </View>
        <ProgressBar
          progress={totalSpent / totalAllocated}
          color={getStatusColor(totalSpent, totalAllocated)}
          height={10}
          style={{ marginTop: Spacing.md }}
        />
        <Text
          style={[
            styles.statusText,
            { color: getStatusColor(totalSpent, totalAllocated) },
          ]}
        >
          {getStatusText(totalSpent, totalAllocated)} • £{totalSpent.toFixed(0)} spent so far
        </Text>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      {budget.map((cat, index) => {
        const ratio = cat.spent / cat.allocated;
        const color = getStatusColor(cat.spent, cat.allocated);
        const catRemaining = cat.allocated - cat.spent;

        return (
          <Animated.View
            key={cat.id}
            entering={FadeInDown.delay(index * 80).duration(400)}
          >
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: color + '18' }]}>
                  <Ionicons name={cat.icon as any} size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryMeta}>
                    £{cat.spent} of £{cat.allocated}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.categoryRemaining, { color }]}>
                    £{catRemaining} left
                  </Text>
                  <Text style={styles.categoryStatus}>
                    {getStatusText(cat.spent, cat.allocated)}
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={ratio}
                color={color}
                height={6}
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </Animated.View>
        );
      })}

      {/* Helpful Note */}
      <View style={styles.noteCard}>
        <Ionicons name="information-circle" size={18} color={Colors.sage} />
        <Text style={styles.noteText}>
          These are estimates based on your inputs. Adjust categories anytime to match your
          reality.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  overviewCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 4 },
  overviewAmount: { ...Typography.title1, color: Colors.text },
  statusText: { ...Typography.caption1, fontWeight: '500', marginTop: Spacing.sm },
  sectionTitle: { ...Typography.title3, color: Colors.text, marginBottom: Spacing.md },
  categoryCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryName: { ...Typography.headline, color: Colors.text },
  categoryMeta: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  categoryRemaining: { ...Typography.headline },
  categoryStatus: { ...Typography.caption2, color: Colors.textMuted, marginTop: 2 },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.sageLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  noteText: { ...Typography.caption1, color: Colors.sageDark, flex: 1, lineHeight: 18 },
});
