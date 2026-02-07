import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';

const features = [
  { icon: 'swap-horizontal' as const, title: 'Unlimited Smart Swaps', sub: 'Find savings on everything' },
  { icon: 'restaurant' as const, title: 'AI Meal Planner', sub: 'Personalised weekly meal plans' },
  { icon: 'flag' as const, title: 'Goal Calculator', sub: 'Plan and track your goals' },
  { icon: 'trophy' as const, title: 'Weekly Challenges', sub: 'Fun tasks with real savings' },
  { icon: 'people' as const, title: 'Community Access', sub: 'Connect with other mums' },
  { icon: 'chatbubble' as const, title: "Rebecca's Corner", sub: 'Exclusive tips and stories' },
];

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={32} color={Colors.sageDark} />
          </View>
          <Text style={styles.heroTitle}>Flourish Premium</Text>
          <Text style={styles.heroSub}>
            Flourish is free to start.{'\n'}Premium helps you go further.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featureList}>
          {features.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color={Colors.sage} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <TouchableOpacity style={styles.priceCard}>
            <Text style={styles.priceLabel}>Monthly</Text>
            <Text style={styles.priceAmount}>£4.99</Text>
            <Text style={styles.pricePer}>/month</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.priceCard, styles.priceCardHighlighted]}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best Value</Text>
            </View>
            <Text style={styles.priceLabel}>Annual</Text>
            <Text style={[styles.priceAmount, { color: Colors.sageDark }]}>£39.99</Text>
            <Text style={styles.pricePer}>/year</Text>
            <Text style={styles.priceSave}>Save 33%</Text>
          </TouchableOpacity>
        </View>

        <FlourishButton
          title="Start 7-day free trial"
          onPress={() => router.back()}
          fullWidth
          size="lg"
          style={{ marginBottom: Spacing.md }}
        />

        <Text style={styles.legalText}>Cancel anytime. No questions asked.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
    marginBottom: Spacing.md,
  },
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: { ...Typography.largeTitle, color: Colors.text },
  heroSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  featureList: { marginBottom: Spacing.xl },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureTitle: { ...Typography.headline, color: Colors.text },
  featureSub: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  pricingSection: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  priceCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  priceCardHighlighted: {
    borderColor: Colors.sage,
    backgroundColor: Colors.sageLight + '40',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.sage,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  bestValueText: { ...Typography.caption2, fontWeight: '700', color: '#FFFFFF' },
  priceLabel: { ...Typography.subhead, color: Colors.textSecondary, marginBottom: Spacing.sm },
  priceAmount: { ...Typography.title1, color: Colors.text },
  pricePer: { ...Typography.caption1, color: Colors.textSecondary },
  priceSave: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.sage,
    marginTop: Spacing.sm,
  },
  legalText: { ...Typography.footnote, color: Colors.textMuted, textAlign: 'center' },
});
