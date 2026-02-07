import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useApp } from '@/context/app-context';

export default function ChallengeScreen() {
  const { challengeDays, completeChallenge } = useApp();
  const completedCount = challengeDays.filter((d) => d.completed).length;
  const totalEstimatedSavings = challengeDays.reduce(
    (sum, d) => sum + parseFloat(d.savingsEstimate.replace('£', '')),
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Header */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>7-Day Savings Challenge</Text>
        <Text style={styles.progressSub}>One small task per day. Real results.</Text>

        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.statValue}>{completedCount}/7</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.statValue, { color: Colors.sage }]}>
              ~£{totalEstimatedSavings}
            </Text>
            <Text style={styles.statLabel}>Potential Savings</Text>
          </View>
        </View>

        <ProgressBar
          progress={completedCount / 7}
          height={8}
          style={{ marginTop: Spacing.md }}
        />
      </View>

      {/* Day Cards */}
      {challengeDays.map((day, index) => (
        <Animated.View
          key={day.day}
          entering={FadeInDown.delay(index * 80).duration(400)}
        >
          <View
            style={[styles.dayCard, day.completed && styles.dayCardCompleted]}
          >
            <View style={styles.dayHeader}>
              <View
                style={[
                  styles.dayBadge,
                  day.completed && styles.dayBadgeCompleted,
                ]}
              >
                {day.completed ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={styles.dayBadgeText}>{day.day}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTitle}>{day.title}</Text>
                <Text style={styles.dayDesc}>{day.description}</Text>
              </View>
              <View style={styles.savingEstimate}>
                <Text style={styles.savingEstimateText}>{day.savingsEstimate}</Text>
              </View>
            </View>

            {!day.completed && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => completeChallenge(day.day)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={18} color={Colors.sage} />
                <Text style={styles.completeButtonText}>Mark complete</Text>
              </TouchableOpacity>
            )}

            {day.completed && (
              <View style={styles.completedBanner}>
                <Ionicons name="sparkles" size={14} color={Colors.sageDark} />
                <Text style={styles.completedText}>Done! Great job 🌱</Text>
              </View>
            )}
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  progressTitle: { ...Typography.title2, color: Colors.text },
  progressSub: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  progressStats: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.lg },
  progressStat: {},
  statValue: { ...Typography.title2, color: Colors.text },
  statLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  dayCardCompleted: {
    backgroundColor: Colors.sageLight + '60',
    borderColor: Colors.sage + '20',
    borderWidth: 1,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  dayBadgeCompleted: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  dayBadgeText: { ...Typography.subhead, fontWeight: '700', color: Colors.textSecondary },
  dayTitle: { ...Typography.headline, color: Colors.text },
  dayDesc: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  savingEstimate: {
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  savingEstimateText: { ...Typography.caption1, fontWeight: '600', color: Colors.gold },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completeButtonText: { ...Typography.subhead, fontWeight: '600', color: Colors.sage },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  completedText: { ...Typography.caption1, color: Colors.sageDark, fontWeight: '500' },
});
