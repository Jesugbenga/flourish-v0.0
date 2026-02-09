import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';
import { useApp } from '@/context/app-context';
import { useAuthContext } from '@/context/auth-context';
import { canAccess } from '@/lib/feature-gate';
import { api, type SmartSwapResponse } from '@/lib/api';
import { MOCK_MODE } from '@/lib/config';
import { smartSwaps } from '@/data/mock-data';

export default function SmartSwapScreen() {
  const { addWin } = useApp();
  const { wins } = useApp();
  const { hasPremium } = useAuthContext();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [aiResult, setAiResult] = useState<SmartSwapResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Gate: redirect free users to paywall
  const gated = !canAccess('smart-swap', hasPremium);

  // Local mock-based filtering
  const filteredSwaps = search
    ? smartSwaps.filter((s) =>
        s.originalItem.toLowerCase().includes(search.toLowerCase())
      )
    : smartSwaps;

  // AI-powered search (premium, non-mock)
  const handleAiSearch = async () => {
    if (!search.trim()) return;
    if (gated) { router.push('/paywall'); return; }

    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await api.smartSwap({ item: search.trim() });
      setAiResult(result);
    } catch {
      // Fall back to local results
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveSwap = (swap: (typeof smartSwaps)[0]) => {
    if (savedItems.has(swap.id)) return;
    setSavedItems((prev) => new Set([...prev, swap.id]));
    addWin({
      id: Date.now().toString(),
      type: 'swap',
      description: `Switched to ${swap.alternative}`,
      amount: swap.savingsWeekly,
      date: new Date().toISOString().split('T')[0],
    });
  };

  // derive saved items from wins so add-state persists across navigation
  const isSwapSaved = (swapId: string, altName?: string) => {
    // check local savedItems first
    if (savedItems.has(swapId)) return true;
    // check wins for matching description
    if (altName && wins.some((w) => w.type === 'swap' && w.description.includes(altName))) return true;
    return false;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Find cheaper alternatives for your everyday items.
      </Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="What do you usually buy?"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={!MOCK_MODE ? handleAiSearch : undefined}
          returnKeyType="search"
        />
        {!MOCK_MODE && (
          <TouchableOpacity onPress={handleAiSearch} disabled={aiLoading}>
            <Ionicons name="sparkles" size={20} color={Colors.sage} />
          </TouchableOpacity>
        )}
      </View>

      {/* AI Loading */}
      {aiLoading && (
        <View style={styles.aiLoadingBox}>
          <ActivityIndicator color={Colors.sage} />
          <Text style={styles.aiLoadingText}>Finding smarter alternatives…</Text>
        </View>
      )}

      {/* AI Results */}
      {aiResult && (
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={16} color={Colors.sage} />
            <Text style={styles.aiHeaderText}>AI Suggestions for "{aiResult.original}"</Text>
          </View>
          {aiResult.swaps.map((swap, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(index * 100).duration(400)}>
              <View style={styles.swapCard}>
                <View style={styles.comparisonRow}>
                  <View style={styles.itemColumn}>
                    <Text style={styles.itemName}>{swap.emoji} {swap.name}</Text>
                    <Text style={styles.aiReason}>{swap.reason}</Text>
                  </View>
                  <View style={styles.saveBadgeAi}>
                    <Text style={styles.saveBadgeAiText}>Save {swap.estimatedSaving}</Text>
                  </View>
                </View>
                  <FlourishButton
                    title={isSwapSaved(`ai-${index}`, swap.name) ? 'Added to wins ✓' : 'Add to my wins'}
                    onPress={() => {
                      if (isSwapSaved(`ai-${index}`, swap.name)) return;
                      setSavedItems((prev) => new Set([...prev, `ai-${index}`]));
                      const amount = parseFloat(swap.estimatedSaving.replace(/[^0-9.]/g, '')) || 0;
                      addWin({
                        id: Date.now().toString(),
                        type: 'swap',
                        description: `Switched to ${swap.name}`,
                        amount,
                        date: new Date().toISOString().split('T')[0],
                      });
                    }}
                    variant={isSwapSaved(`ai-${index}`, swap.name) ? 'secondary' : 'primary'}
                    fullWidth
                    disabled={isSwapSaved(`ai-${index}`, swap.name)}
                  />
              </View>
            </Animated.View>
          ))}
          {aiResult.tip && (
            <View style={styles.aiTipBox}>
              <Ionicons name="bulb" size={14} color={Colors.gold} />
              <Text style={styles.aiTipText}>{aiResult.tip}</Text>
            </View>
          )}
        </View>
      )}

      {/* Swap Cards */}
      {filteredSwaps.map((swap, index) => (
        <Animated.View
          key={swap.id}
          entering={FadeInDown.delay(index * 100).duration(400)}
        >
          <View style={styles.swapCard}>
            <View style={styles.comparisonRow}>
              {/* Original */}
              <View style={styles.itemColumn}>
                <View style={[styles.itemBadge, { backgroundColor: Colors.dangerLight }]}>
                  <Text style={[styles.itemBadgeText, { color: Colors.danger }]}>Current</Text>
                </View>
                <Text style={styles.itemName}>{swap.originalItem}</Text>
                <Text style={styles.itemPrice}>£{swap.originalPrice.toFixed(2)}</Text>
              </View>

              <View style={styles.arrowWrap}>
                <Ionicons name="arrow-forward" size={20} color={Colors.sage} />
              </View>

              {/* Alternative */}
              <View style={styles.itemColumn}>
                <View style={[styles.itemBadge, { backgroundColor: Colors.successLight }]}>
                  <Text style={[styles.itemBadgeText, { color: Colors.sage }]}>Switch to</Text>
                </View>
                <Text style={styles.itemName}>{swap.alternative}</Text>
                <Text style={[styles.itemPrice, { color: Colors.sage }]}>
                  £{swap.alternativePrice.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Savings */}
            <View style={styles.savingsRow}>
              <View style={styles.savingChip}>
                <Text style={styles.savingChipText}>
                  £{swap.savingsWeekly.toFixed(2)}/week
                </Text>
              </View>
              <View style={[styles.savingChip, { backgroundColor: Colors.goldLight }]}>
                <Text style={[styles.savingChipText, { color: Colors.gold }]}>
                  ≈ £{swap.savingsYearly.toFixed(0)}/year
                </Text>
              </View>
            </View>

            {/* Confidence */}
            <View style={styles.confidenceRow}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.sage} />
              <Text style={styles.confidenceText}>
                {swap.confidence}% match quality
              </Text>
            </View>

            {/* CTA */}
            <FlourishButton
              title={isSwapSaved(swap.id, swap.alternative) ? 'Added to wins ✓' : 'Add to my wins'}
              onPress={() => handleSaveSwap(swap)}
              variant={isSwapSaved(swap.id, swap.alternative) ? 'secondary' : 'primary'}
              fullWidth
              disabled={isSwapSaved(swap.id, swap.alternative)}
              icon={isSwapSaved(swap.id, swap.alternative) ? 'checkmark-circle' : 'add-circle'}
            />
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  swapCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  itemColumn: { flex: 1 },
  itemBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  itemBadgeText: { ...Typography.caption2, fontWeight: '600' },
  itemName: { ...Typography.subhead, color: Colors.text, marginBottom: 4 },
  itemPrice: { ...Typography.title3, color: Colors.text },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.sm,
    marginTop: 20,
  },
  savingsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  savingChip: {
    backgroundColor: Colors.sageLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  savingChipText: { ...Typography.caption1, fontWeight: '600', color: Colors.sageDark },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  confidenceText: { ...Typography.caption1, color: Colors.textSecondary },
  // AI section styles
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  aiLoadingText: { ...Typography.subhead, color: Colors.textSecondary },
  aiSection: { marginBottom: Spacing.xl },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  aiHeaderText: { ...Typography.headline, color: Colors.text },
  aiReason: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  saveBadgeAi: {
    backgroundColor: Colors.sageLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginLeft: Spacing.sm,
  },
  saveBadgeAiText: { ...Typography.caption1, fontWeight: '600', color: Colors.sageDark },
  aiTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.goldLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  aiTipText: { ...Typography.caption1, color: Colors.text, flex: 1 },
});
