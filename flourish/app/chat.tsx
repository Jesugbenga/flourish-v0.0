import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useAuthContext } from '@/context/auth-context';
import { canAccess } from '@/lib/feature-gate';
import { api } from '@/lib/api';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

// ── Typing indicator ──────────────────────
const TypingDots = () => {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let mounted = true;
    const animate = (val: Animated.Value, delay: number) =>
      setTimeout(() => {
        if (!mounted) return;
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ])
        ).start();
      }, delay);
    animate(d1, 0);
    animate(d2, 160);
    animate(d3, 320);
    return () => { mounted = false; };
  }, [d1, d2, d3]);

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, { opacity: d1 }]} />
      <Animated.View style={[styles.dot, { opacity: d2 }]} />
      <Animated.View style={[styles.dot, { opacity: d3 }]} />
    </View>
  );
};

// ── Chat Screen ───────────────────────────
export default function ChatScreen() {
  const { hasPremium } = useAuthContext();
  const router = useRouter();
  const allowed = canAccess('ai-chat', hasPremium);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<Msg> | null>(null);

  const scrollToEnd = (delay = 120) =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), delay);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!allowed) {
      Alert.alert('Premium required', 'Chat with Flo is available for Premium subscribers.');
      return;
    }

    const userMsg: Msg = { id: Date.now().toString() + '-u', role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setText('');
    setLoading(true);
    scrollToEnd();

    try {
      const resp = await api.chat({
        message: userMsg.text,
        conversationHistory: messages.map((m) => ({ role: m.role, content: m.text })),
      });
      setMessages((m) => [...m, { id: Date.now().toString() + '-a', role: 'assistant', text: resp.reply }]);
    } catch (err) {
      console.error('Chat error', err);
      Alert.alert('Chat error', 'Unable to reach Flo right now. Please try again.');
      setMessages((m) => m.filter((msg) => msg.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0 || loading) scrollToEnd(150);
  }, [messages.length, loading]);

  // ── Render ──────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
    >
      {!allowed ? (
        <View style={styles.lockContainer}>
          <View style={styles.lockCard}>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={28} color={Colors.sage} />
            </View>
            <Text style={styles.lockTitle}>Premium Feature</Text>
            <Text style={styles.lockSub}>Chat with Flo for personalised financial guidance tailored to your goals.</Text>
            <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.8} onPress={() => router.push('/paywall')}>
              <Ionicons name="sparkles" size={16} color={Colors.background} />
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.messages}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.floAvatar}>
                  <Ionicons name="leaf" size={32} color={Colors.sage} />
                </View>
                <Text style={styles.emptyTitle}>Chat with Flo</Text>
                <Text style={styles.emptySub}>Your personal financial wellness assistant.{"\n"}Ask about budgeting, saving, or family finances.</Text>
                <View style={styles.chipRow}>
                  {['💡 Saving tips', '🛒 Smart swaps', '📊 Budget help'].map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={styles.chip}
                      activeOpacity={0.7}
                      onPress={() => { setText(chip.replace(/^[^\s]+\s/, '')); }}
                    >
                      <Text style={styles.chipText}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
            ListFooterComponent={
              loading ? (
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <TypingDots />
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                {item.role === 'assistant' && (
                  <View style={styles.floMini}>
                    <Ionicons name="leaf" size={12} color={Colors.sage} />
                  </View>
                )}
                <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.assistantText]}>
                  {item.text}
                </Text>
              </View>
            )}
          />

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Message Flo…"
                placeholderTextColor={Colors.textMuted}
                value={text}
                onChangeText={setText}
                style={styles.input}
                multiline
                editable={!loading}
                returnKeyType="default"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!text.trim() || loading) && styles.sendBtnDisabled]}
                onPress={send}
                disabled={loading || !text.trim()}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color={Colors.background} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Messages
  messages: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexGrow: 1,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  floAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptySub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.sageLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    ...Typography.footnote,
    color: Colors.sageDark,
  },

  // Bubbles
  bubble: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    maxWidth: '82%',
  },
  userBubble: {
    backgroundColor: Colors.sage,
    alignSelf: 'flex-end',
    borderBottomRightRadius: BorderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: Colors.card,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  floMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubbleText: { ...Typography.body, lineHeight: 22 },
  userText: { color: Colors.card },
  assistantText: { color: Colors.text },

  // Input
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.sm : Spacing.md,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    minHeight: 40,
    color: Colors.text,
    ...Typography.body,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },

  // Typing dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },

  // Lock / paywall
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  lockCard: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    width: '100%',
    ...Shadows.medium,
  },
  lockIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  lockTitle: { ...Typography.title3, color: Colors.text, marginBottom: Spacing.sm },
  lockSub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.sage,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  upgradeBtnText: { ...Typography.subhead, color: Colors.background, fontWeight: '600' },
});
