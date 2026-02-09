import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useApp } from '@/context/app-context';
import { useState, useEffect } from 'react';

const categoryIcons = [
  'restaurant',
  'car',
  'home',
  'heart',
  'book',
  'cart',
  'game-controller',
  'airplane',
  'barbell',
  'bulb',
];

export default function BudgetTrackerScreen() {
  const { budget, monthlyBudget, updateBudget, setMonthlyBudget, addCategory, deleteCategory } = useApp();
  const [localMonthlyBudget, setLocalMonthlyBudget] = useState(String(monthlyBudget));
  const [localBudget, setLocalBudget] = useState(budget);
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAllocated, setNewCategoryAllocated] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setLocalBudget(budget);
  }, [budget]);

  const handleMonthlyBudgetChange = (text: string) => {
    setLocalMonthlyBudget(text);
    const amount = parseFloat(text) || 0;
    if (amount > 0) {
      setMonthlyBudget(amount);
      setValidationError('');
    }
  };

  const handleCategoryAllocatedChange = (categoryId: string, allocated: string) => {
    const amount = parseFloat(allocated) || 0;
    setLocalBudget((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, allocated: amount } : c))
    );
    validateBudget(amount, categoryId);
  };

  const handleCategorySpentChange = (categoryId: string, spent: string) => {
    const amount = parseFloat(spent) || 0;
    setLocalBudget((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, spent: amount } : c))
    );
    updateBudget(categoryId, amount);
  };

  const validateBudget = (newAllocated: number, changedCategoryId: string) => {
    const totalAllocated = localBudget.reduce((sum, c) => {
      if (c.id === changedCategoryId) return sum + newAllocated;
      return sum + c.allocated;
    }, 0);
    const monthlyAmount = parseFloat(localMonthlyBudget) || 0;

    if (totalAllocated > monthlyAmount) {
      setValidationError(
        `Total budget (£${totalAllocated.toFixed(2)}) exceeds monthly limit (£${monthlyAmount.toFixed(2)})`
      );
    } else {
      setValidationError('');
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !newCategoryAllocated.trim()) {
      Alert.alert('Required fields', 'Please enter category name and allocated budget');
      return;
    }

    const allocated = parseFloat(newCategoryAllocated) || 0;
    const totalWithNew = localBudget.reduce((sum, c) => sum + c.allocated, 0) + allocated;
    const monthlyAmount = parseFloat(localMonthlyBudget) || 0;

    if (totalWithNew > monthlyAmount) {
      Alert.alert(
        'Budget exceeded',
        `Adding this category would exceed your monthly budget. Current total: £${totalWithNew.toFixed(2)}, Monthly limit: £${monthlyAmount.toFixed(2)}`
      );
      return;
    }

    addCategory({
      name: newCategoryName,
      allocated,
      spent: 0,
      icon: categoryIcons[selectedIconIndex],
    });

    setNewCategoryName('');
    setNewCategoryAllocated('');
    setSelectedIconIndex(0);
    setShowAddForm(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert('Delete category?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCategory(categoryId),
      },
    ]);
  };

  const totalAllocated = localBudget.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = localBudget.reduce((sum, c) => sum + c.spent, 0);
  const monthlyAmount = parseFloat(localMonthlyBudget) || 0;
  const remaining = monthlyAmount - totalSpent;

  const getStatusColor = (spent: number, allocated: number) => {
    if (allocated === 0) return Colors.textMuted;
    const ratio = spent / allocated;
    if (ratio > 0.95) return Colors.danger;
    if (ratio > 0.8) return '#D4A843';
    return Colors.sage;
  };

  const getStatusText = (spent: number, allocated: number) => {
    if (allocated === 0) return 'No budget';
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

      {/* Monthly Budget Input */}
      <View style={styles.monthlyBudgetSection}>
        <Text style={styles.sectionLabel}>Monthly Budget</Text>
        <View style={styles.budgetInputContainer}>
          <Text style={styles.currencySymbol}>£</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={localMonthlyBudget}
            onChangeText={handleMonthlyBudgetChange}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            style={styles.budgetInput}
          />
        </View>
      </View>

      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overviewLabel}>Allocated</Text>
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
          progress={monthlyAmount > 0 ? totalSpent / monthlyAmount : 0}
          color={getStatusColor(totalSpent, monthlyAmount)}
          height={10}
          style={{ marginTop: Spacing.md }}
        />
        <Text
          style={[
            styles.statusText,
            { color: getStatusColor(totalSpent, monthlyAmount) },
          ]}
        >
          {getStatusText(totalSpent, monthlyAmount)} • £{totalSpent.toFixed(0)} spent so far
        </Text>
      </View>

      {/* Validation Error */}
      {validationError ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      ) : null}

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {localBudget.map((cat, index) => {
          const ratio = cat.allocated > 0 ? cat.spent / cat.allocated : 0;
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
                    <View style={styles.categoryEditRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Allocated</Text>
                        <TextInput
                          keyboardType="decimal-pad"
                          value={String(cat.allocated)}
                          onChangeText={(t) => handleCategoryAllocatedChange(cat.id, t)}
                          style={styles.categoryInput}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Spent</Text>
                        <TextInput
                          keyboardType="decimal-pad"
                          value={String(cat.spent)}
                          onChangeText={(t) => handleCategorySpentChange(cat.id, t)}
                          style={styles.categoryInput}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.categoryRightColumn}>
                    <View style={{ alignItems: 'flex-end', marginBottom: Spacing.sm }}>
                      <Text style={[styles.categoryRemaining, { color }]}>
                        £{catRemaining.toFixed(0)} left
                      </Text>
                      <Text style={styles.categoryStatus}>
                        {getStatusText(cat.spent, cat.allocated)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(cat.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
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
      </View>

      {/* Add Category Button */}
      {!showAddForm ? (
        <TouchableOpacity
          style={styles.addCategoryButton}
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add-circle" size={20} color={Colors.sage} />
          <Text style={styles.addCategoryText}>Add Category</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addCategoryCard}>
          <Text style={styles.addCategoryTitle}>New Category</Text>

          {/* Icon Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            {categoryIcons.map((icon, idx) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIconIndex === idx && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIconIndex(idx)}
              >
                <Ionicons
                  name={icon as any}
                  size={24}
                  color={selectedIconIndex === idx ? Colors.sage : Colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category Name */}
          <TextInput
            placeholder="Category name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            style={styles.newCategoryInput}
            placeholderTextColor={Colors.textMuted}
          />

          {/* Allocated Budget */}
          <View style={styles.budgetInputContainer}>
            <Text style={styles.currencySymbol}>£</Text>
            <TextInput
              keyboardType="decimal-pad"
              placeholder="Allocated budget"
              value={newCategoryAllocated}
              onChangeText={setNewCategoryAllocated}
              style={[styles.newCategoryInput, { flex: 1 }]}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Buttons */}
          <View style={styles.formButtonRow}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => {
                setShowAddForm(false);
                setNewCategoryName('');
                setNewCategoryAllocated('');
                setSelectedIconIndex(0);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.addButton]}
              onPress={handleAddCategory}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

  monthlyBudgetSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  currencySymbol: {
    ...Typography.title2,
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  budgetInput: {
    flex: 1,
    ...Typography.title2,
    color: Colors.text,
    padding: Spacing.md,
  },

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

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.danger,
    flex: 1,
    lineHeight: 18,
  },

  categoriesSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: { ...Typography.title3, color: Colors.text, marginBottom: Spacing.md },
  categoryCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  categoryName: { ...Typography.headline, color: Colors.text },
  categoryEditRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    ...Typography.caption2,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  categoryInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    ...Typography.caption1,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryRightColumn: {
    marginLeft: Spacing.md,
  },
  categoryRemaining: { ...Typography.headline },
  categoryStatus: { ...Typography.caption2, color: Colors.textMuted, marginTop: 2 },
  deleteButton: {
    padding: Spacing.sm,
  },

  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.sage + '30',
    borderStyle: 'dashed',
  },
  addCategoryText: {
    ...Typography.headline,
    color: Colors.sage,
  },

  addCategoryCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  addCategoryTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconOptionSelected: {
    backgroundColor: Colors.sage + '15',
    borderColor: Colors.sage,
    borderWidth: 2,
  },
  newCategoryInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  formButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.headline,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.sage,
  },
  addButtonText: {
    ...Typography.headline,
    color: Colors.background,
  },

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
