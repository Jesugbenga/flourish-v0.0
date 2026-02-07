import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';
import { useApp } from '@/context/app-context';
import { smartSwaps } from '@/data/mock-data';

export default function SmartSwapScreen() {
  const { addWin } = useApp();
  const [search, setSearch] = useState('');
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const filteredSwaps = search
    ? smartSwaps.filter((s) =>
        s.originalItem.toLowerCase().includes(search.toLowerCase())
      )
    : smartSwaps;

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
        />
      </View>

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
              title={savedItems.has(swap.id) ? 'Added to wins ✓' : 'Add to my wins'}
              onPress={() => handleSaveSwap(swap)}
              variant={savedItems.has(swap.id) ? 'secondary' : 'primary'}
              fullWidth
              disabled={savedItems.has(swap.id)}
              icon={savedItems.has(swap.id) ? 'checkmark-circle' : 'add-circle'}
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
});
