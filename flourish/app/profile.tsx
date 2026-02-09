/**
 * Profile screen — shows account info, subscription status,
 * edit profile, and sign-out.
 */

import { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { FlourishButton } from '@/components/ui/flourish-button';
import { useAuthContext } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api, type ProfileData } from '@/lib/api';
import { MOCK_MODE } from '@/lib/config';

export default function ProfileScreen() {
  const router = useRouter();
  const { hasPremium, email, signOut } = useAuthContext();
  const { user } = useApp();
  const { wins } = useApp();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState(user.name);
  const [numKids, setNumKids] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const { refreshProfile } = useApp();
  const [editing, setEditing] = useState(false);

  // Fetch full profile on mount
  useEffect(() => {
    if (MOCK_MODE) return;
    api.getProfile().then((p) => {
      setProfile(p);
      setDisplayName(p.profile.displayName ?? '');
      setNumKids(p.profile.numKids?.toString() ?? '');
      setMonthlyBudget(p.profile.monthlyBudget?.toString() ?? '');
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!MOCK_MODE) {
        const updated = await api.updateProfile({
          displayName: displayName || undefined,
          numKids: numKids ? parseInt(numKids, 10) : undefined,
          monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : undefined,
        });
        setProfile(updated);        // Update display fields from response
        setDisplayName(updated.profile.displayName ?? '');
        setNumKids(updated.profile.numKids?.toString() ?? '');
        setMonthlyBudget(updated.profile.monthlyBudget?.toString() ?? '');
        // Refresh global profile state
        await refreshProfile();
        setEditing(false);
      }
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          // InitGate will automatically redirect to /auth/sign-in
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar / heading */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={Colors.sageDark} />
          </View>
          <Text style={styles.name}>{displayName || 'Flourish User'}</Text>
          <Text style={styles.email}>{email ?? 'demo@flourish.app'}</Text>

          {/* Subscription badge */}
          <View style={[styles.badge, hasPremium && styles.badgePremium]}>
            <Ionicons
              name={hasPremium ? 'star' : 'leaf-outline'}
              size={14}
              color={hasPremium ? '#FFFFFF' : Colors.sage}
            />
            <Text style={[styles.badgeText, hasPremium && styles.badgeTextPremium]}>
              {hasPremium ? 'Premium' : 'Free Plan'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>£{user.totalSavings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Saved</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{wins.length}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
          </View>
        </Card>

        {/* Edit fields */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <FlourishButton
            title={editing ? 'Cancel' : 'Edit'}
            onPress={() => setEditing((s) => !s)}
            variant={editing ? 'outline' : 'primary'}
          />
        </View>

        <Text style={styles.label}>Display name</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <Text style={{ ...Typography.body, color: Colors.text }}>{displayName || '—'}</Text>
        )}

        <Text style={styles.label}>Number of kids</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={numKids}
            onChangeText={setNumKids}
            placeholder="0"
            keyboardType="number-pad"
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <Text style={{ ...Typography.body, color: Colors.text }}>{numKids || '0'}</Text>
        )}

        <Text style={styles.label}>Monthly budget (£)</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={monthlyBudget}
            onChangeText={setMonthlyBudget}
            placeholder="e.g. 1200"
            keyboardType="decimal-pad"
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <Text style={{ ...Typography.body, color: Colors.text }}>{monthlyBudget || '—'}</Text>
        )}

        {editing && (
          <FlourishButton
            title={saving ? 'Saving…' : 'Save Changes'}
            onPress={handleSave}
            fullWidth
            disabled={saving}
            style={{ marginTop: Spacing.lg }}
          />
        )}

        {/* Upgrade CTA (free users) */}
        {!hasPremium && (
          <TouchableOpacity
            style={styles.upgradeRow}
            onPress={() => router.push('/paywall')}
          >
            <View style={styles.upgradeLeft}>
              <Ionicons name="star" size={20} color={Colors.sage} />
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Sign out */}
        <FlourishButton
          title="Sign Out"
          onPress={handleSignOut}
          fullWidth
          variant="outline"
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  name: { ...Typography.title2, color: Colors.text },
  email: { ...Typography.subhead, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.sageLight,
  },
  badgePremium: { backgroundColor: Colors.sage },
  badgeText: { ...Typography.caption1, fontWeight: '600', color: Colors.sage },
  badgeTextPremium: { color: '#FFFFFF' },
  statsCard: { marginBottom: Spacing.xl },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { ...Typography.title2, color: Colors.sageDark },
  statLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.text,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.sageLight + '60',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  upgradeText: { ...Typography.headline, color: Colors.text },
});
