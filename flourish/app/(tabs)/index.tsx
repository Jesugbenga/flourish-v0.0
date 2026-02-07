import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { useApp } from '@/context/app-context';
import { dailyTips, quickActions } from '@/data/mock-data';

const { width } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useApp();
  const todayTip = dailyTips[Math.floor(Date.now() / 86400000) % dailyTips.length];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Greeting ── */}
        <View style={styles.greeting}>
          <View style={styles.greetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingText}>
                {getGreeting()}, {user.name} 🌱
              </Text>
              <Text style={styles.subGreeting}>
                One small step today makes a difference.
              </Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={36} color={Colors.sage} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Daily Tip Card ── */}
        <Card variant="elevated" style={styles.tipCard} onPress={() => router.push('/smart-swap')}>
          <View style={styles.tipBadge}>
            <Ionicons name="sunny" size={14} color={Colors.gold} />
            <Text style={styles.tipBadgeText}>Today's Win</Text>
          </View>
          <Text style={styles.tipTitle}>{todayTip.title}</Text>
          <Text style={styles.tipBody}>{todayTip.body}</Text>
          <View style={styles.tipFooter}>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save {todayTip.savingsEstimate}</Text>
            </View>
            <View style={styles.tryButton}>
              <Text style={styles.tryButtonText}>Try this</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.sage} />
            </View>
          </View>
        </Card>

        {/* ── Quick Actions ── */}
        <SectionHeader title="Quick Actions" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionsScroll}
        >
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={Colors.textMuted}
                style={{ marginTop: 8 }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Savings Badge ── */}
        <TouchableOpacity
          style={styles.savingsCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/wins')}
        >
          <View style={styles.savingsCardInner}>
            <View style={styles.savingsIconWrap}>
              <Ionicons name="leaf" size={22} color={Colors.sageDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.savingsCardAmount}>
                £{user.totalSavings.toFixed(2)} saved
              </Text>
              <Text style={styles.savingsCardSub}>Since you started Flourish</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.sageDark} />
          </View>
        </TouchableOpacity>

        {/* ── 7-Day Challenge Promo ── */}
        <Card variant="outline" style={styles.challengeCard} onPress={() => router.push('/challenge')}>
          <View style={styles.challengeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.challengeTitle}>7-Day Savings Challenge</Text>
              <Text style={styles.challengeSub}>Small daily tasks, real savings.</Text>
            </View>
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeBadgeText}>Day 4</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  greeting: {
    marginBottom: Spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greetingText: {
    ...Typography.title1,
    color: Colors.text,
  },
  subGreeting: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  profileButton: {
    marginLeft: Spacing.md,
    marginTop: 4,
  },
  tipCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  tipBadgeText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    ...Typography.title2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tipBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsBadge: {
    backgroundColor: Colors.sageLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  savingsText: {
    ...Typography.footnote,
    fontWeight: '600',
    color: Colors.sageDark,
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tryButtonText: {
    ...Typography.headline,
    color: Colors.sage,
  },
  actionsScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    width: (width - Spacing.lg * 2 - Spacing.md) / 2.3,
    ...Shadows.small,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  actionTitle: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  savingsCard: {
    backgroundColor: Colors.sageLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  savingsCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  savingsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sageMuted + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsCardAmount: {
    ...Typography.title3,
    color: Colors.sageDark,
  },
  savingsCardSub: {
    ...Typography.caption1,
    color: Colors.sageDark,
    opacity: 0.7,
    marginTop: 2,
  },
  challengeCard: {
    borderColor: Colors.gold + '40',
    borderWidth: 1.5,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  challengeSub: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  challengeBadge: {
    backgroundColor: Colors.goldLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  challengeBadgeText: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.gold,
  },
});
