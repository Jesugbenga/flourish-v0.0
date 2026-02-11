import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useAuthContext } from '@/context/auth-context';

const planItems = [
  {
    id: 'swap',
    title: 'Smart Swap',
    subtitle: 'Find cheaper alternatives for everyday items',
    icon: 'swap-horizontal' as const,
    color: Colors.sage,
    route: '/smart-swap',
    savings: 'Save £5–£10/week',
  },
  {
    id: 'meal',
    title: 'Meal Planner',
    subtitle: 'Quick meals that save money and time',
    icon: 'restaurant' as const,
    color: '#D4A843',
    route: '/meal-planner',
    savings: 'Save £15–£25/week',
  },
  {
    id: 'budget',
    title: 'Budget Tracker',
    subtitle: 'See where your money goes — no judgement',
    icon: 'wallet' as const,
    color: '#7EAAB0',
    route: '/budget-tracker',
    savings: 'Stay in control',
  },
  {
    id: 'goal',
    title: 'Goal Calculator',
    subtitle: 'What are you saving for?',
    icon: 'flag' as const,
    color: '#B07EAA',
    route: '/goal-calculator',
    savings: 'Plan your future',
  },
];

export default function PlanScreen() {
  const router = useRouter();
  const { hasPremium } = useAuthContext();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your Plan</Text>
        <Text style={styles.subtitle}>
          Tools to help you make smarter money choices.
        </Text>

        {planItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              <View style={styles.savingsPill}>
                <Text style={[styles.savingsPillText, { color: item.color }]}>
                  {item.savings}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Premium Banner (hidden when user has premium) */}
        {!hasPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            activeOpacity={0.8}
            onPress={() => router.push('/paywall')}
          >
            <View style={styles.premiumContent}>
              <Ionicons name="sparkles" size={20} color={Colors.gold} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.premiumTitle}>Unlock Premium</Text>
                <Text style={styles.premiumSub}>Unlimited swaps, AI meal plans & more</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={Colors.gold} />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { ...Typography.largeTitle, color: Colors.text, marginBottom: Spacing.xs },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardContent: { flex: 1 },
  cardTitle: { ...Typography.headline, color: Colors.text },
  cardSubtitle: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  savingsPill: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  savingsPillText: { ...Typography.caption2, fontWeight: '600' },
  premiumBanner: {
    backgroundColor: Colors.goldLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
  },
  premiumContent: { flexDirection: 'row', alignItems: 'center' },
  premiumTitle: { ...Typography.headline, color: Colors.text },
  premiumSub: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
});
