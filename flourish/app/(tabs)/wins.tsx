import { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Share, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useApp } from '@/context/app-context';

const winTypeConfig: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  swap: { icon: 'swap-horizontal', color: '#8AAE92', label: 'Smart Swaps' },
  meal: { icon: 'restaurant', color: '#D4A843', label: 'Meal Savings' },
  budget: { icon: 'wallet', color: '#7EAAB0', label: 'Budget Tweaks' },
  challenge: { icon: 'trophy', color: '#B07EAA', label: 'Challenges' },
};

export default function WinsScreen() {
  const router = useRouter();
  const { user, wins, challengeDays, refreshWins } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWins();
    setRefreshing(false);
  }, [refreshWins]);

  const shareWins = async () => {
    try {
      await Share.share({
        message: `I've saved £${user.totalSavings.toFixed(2)} using Flourish 🌱\nSmall steps, real savings.`,
      });
    } catch {}
  };

  const completedDays = challengeDays.filter((d) => d.completed).length;
  const totalChallengeDays = challengeDays.length;

  // Helper: safe number formatting — fall back to 0.00 when value is missing
  const formatNumber = (v?: number | null) => {
    const n = Number(v ?? 0) || 0;
    return n.toFixed(2);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.sage} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Wins</Text>
          <TouchableOpacity onPress={shareWins} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={22} color={Colors.sage} />
          </TouchableOpacity>
        </View>

        {/* ── Total Savings ── */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Saved</Text>
          <Text style={styles.totalAmount}>£{formatNumber(user.totalSavings)}</Text>
          <Text style={styles.totalSub}>Since you started Flourish</Text>
        </Animated.View>

        {/* ── Breakdown ── */}
        <Text style={styles.sectionTitle}>Breakdown</Text>
        <View style={styles.breakdownGrid}>
          {Object.entries(winTypeConfig).map(([key, config]) => {
            const amount =
              key === 'swap'
                ? user.swapSavings
                : key === 'meal'
                  ? user.mealSavings
                  : key === 'budget'
                    ? user.budgetSavings
                    : user.challengeSavings;
            return (
              <View key={key} style={styles.breakdownCard}>
                <View style={[styles.breakdownIcon, { backgroundColor: config.color + '18' }]}>
                  <Ionicons name={config.icon} size={20} color={config.color} />
                </View>
                <Text style={styles.breakdownAmount}>£{formatNumber(amount)}</Text>
                <Text style={styles.breakdownLabel}>{config.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Challenge Progress ── */}
        <Card
          variant="outline"
          style={styles.challengeCard}
          onPress={() => router.push('/challenge')}
        >
          <View style={styles.challengeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.challengeTitle}>7-Day Challenge</Text>
              <Text style={styles.challengeSub}>
                {completedDays} of {totalChallengeDays} days complete
              </Text>
              <ProgressBar
                progress={totalChallengeDays > 0 ? completedDays / totalChallengeDays : 0}
                style={{ marginTop: 10 }}
                color={Colors.gold}
                backgroundColor={Colors.goldLight}
              />
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textMuted}
              style={{ marginLeft: 12 }}
            />
          </View>
        </Card>

        {/* ── Recent Activity ── */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {wins.slice(0, 5).map((win, index) => {
          const cfg = winTypeConfig[win.type];
          return (
            <Animated.View key={win.id} entering={FadeInUp.delay(index * 80).duration(400)}>
              <View style={styles.winRow}>
                <View style={[styles.winIcon, { backgroundColor: cfg.color + '18' }]}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.winDesc}>{win.description}</Text>
                  <Text style={styles.winDate}>{win.date}</Text>
                </View>
                <Text style={styles.winAmount}>+£{formatNumber(win.amount)}</Text>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.largeTitle, color: Colors.text },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: {
    backgroundColor: Colors.sage,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  totalLabel: {
    ...Typography.subhead,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  totalSub: {
    ...Typography.caption1,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  breakdownCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  breakdownAmount: { ...Typography.title3, color: Colors.text },
  breakdownLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  challengeCard: { marginBottom: Spacing.lg, borderColor: Colors.gold + '40' },
  challengeRow: { flexDirection: 'row', alignItems: 'center' },
  challengeTitle: { ...Typography.headline, color: Colors.text },
  challengeSub: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  winRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  winIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  winDesc: { ...Typography.subhead, color: Colors.text },
  winDate: { ...Typography.caption2, color: Colors.textMuted, marginTop: 2 },
  winAmount: { ...Typography.headline, color: Colors.sage },
});
