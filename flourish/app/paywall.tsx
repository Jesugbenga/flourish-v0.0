import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Purchases, {
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';
import { useAuthContext } from '@/context/auth-context';
import { PREMIUM_ENTITLEMENT } from '@/lib/config';

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
  const { refreshPremium, isPurchasesConfigured } = useAuthContext();
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch RevenueCat offerings ──
  const fetchOfferings = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const result = await Purchases.getOfferings();
      if (result.current && result.current.availablePackages.length > 0) {
        setOfferings(result);
      } else {
        const reason = !result.current
          ? 'Set a "Current" offering in RevenueCat: Dashboard → Offerings.'
          : 'Current offering has no packages. In RevenueCat add products (Google Play / App Store) to your offering.';
        console.warn('[Paywall] Offerings empty:', reason);
        setLoadError(reason);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Paywall] Failed to fetch offerings:', err);
      setLoadError(message || 'Could not load plans. Check Android API key and RevenueCat setup.');
    } finally {
      setLoading(false);
    }
  };

  // Only fetch offerings after RevenueCat SDK is configured (avoids "no singleton instance" error)
  useEffect(() => {
    if (!isPurchasesConfigured) {
      setLoading(true);
      return;
    }
    fetchOfferings();
  }, [isPurchasesConfigured]);

  // If SDK never configures (e.g. no API key), show error after a short delay
  useEffect(() => {
    if (isPurchasesConfigured) return;
    const t = setTimeout(() => {
      setLoadError('RevenueCat is not configured. Add EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY (Android) or EXPO_PUBLIC_REVENUECAT_API_KEY (iOS) to your .env.');
      setLoading(false);
    }, 2500);
    return () => clearTimeout(t);
  }, [isPurchasesConfigured]);

  // ── Handle purchase ──
  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      if (customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined) {
        // Refresh in-memory state so the whole app unlocks
        await refreshPremium();
        router.back();
      } else {
        Alert.alert('Missing entitlement', 'Purchase succeeded but premium access not activated. Please restart the app.');
      }
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean };
      if (!err.userCancelled) {
        Alert.alert('Purchase failed', 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  // ── Helper: label a package nicely ──
  const packageLabel = (pkg: PurchasesPackage) => {
    const type = pkg.packageType.toLowerCase();
    if (type.includes('annual')) return 'Annual';
    if (type.includes('month')) return 'Monthly';
    if (type.includes('week')) return 'Weekly';
    return pkg.product.title;
  };

  const isPopular = (pkg: PurchasesPackage) =>
    pkg.packageType.toLowerCase().includes('annual');

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

        {/* Pricing — dynamically rendered from RevenueCat packages */}
        <View style={styles.pricingSection}>
          {offerings?.current?.availablePackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.identifier}
              style={[styles.priceCard, isPopular(pkg) && styles.priceCardHighlighted]}
              onPress={() => handlePurchase(pkg)}
              disabled={purchasing}
            >
              {isPopular(pkg) && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
              )}
              <Text style={styles.priceLabel}>{packageLabel(pkg)}</Text>
              <Text style={[styles.priceAmount, isPopular(pkg) && { color: Colors.sageDark }]}>
                {pkg.product.priceString}
              </Text>
              <Text style={styles.pricePer}>/{pkg.packageType.toLowerCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && !offerings && !loadError && (
          <Text style={[styles.legalText, { marginBottom: Spacing.md }]}>
            Loading plans…
          </Text>
        )}
        {loadError && (
          <View style={[styles.errorBox, { marginBottom: Spacing.md }]}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchOfferings}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlourishButton
          title={purchasing ? 'Processing…' : 'Start 7-day free trial'}
          onPress={() => {
            // Default to the annual package if available
            const pkg = offerings?.current?.annual ?? offerings?.current?.availablePackages[0];
            if (pkg) handlePurchase(pkg);
          }}
          fullWidth
          size="lg"
          disabled={purchasing || !offerings}
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
  pricingSection: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl, flexWrap: 'wrap' },
  priceCard: {
    flex: 1,
    minWidth: 140,
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
  legalText: { ...Typography.footnote, color: Colors.textMuted, textAlign: 'center' },
  errorBox: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: { ...Typography.footnote, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.sm },
  retryBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.sageLight,
    borderRadius: BorderRadius.md,
  },
  retryBtnText: { ...Typography.subhead, fontWeight: '600', color: Colors.sageDark },
});
