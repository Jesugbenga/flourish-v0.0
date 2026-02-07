import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { FlourishButton } from '@/components/ui/flourish-button';
import { lessons } from '@/data/mock-data';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lesson = lessons.find((l) => l.id === id);
  const [currentCard, setCurrentCard] = useState(0);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Lesson not found</Text>
      </SafeAreaView>
    );
  }

  const card = lesson.cards[currentCard];
  const isLast = currentCard === lesson.cards.length - 1;
  const isFirst = currentCard === 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {lesson.cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentCard && styles.dotActive,
                i < currentCard && styles.dotDone,
              ]}
            />
          ))}
        </View>

        {/* Card */}
        <Animated.View
          key={currentCard}
          entering={FadeInRight.duration(300)}
          style={styles.cardWrap}
        >
          <View style={styles.lessonCard}>
            <View style={styles.cardNumber}>
              <Text style={styles.cardNumberText}>
                {currentCard + 1} of {lesson.cards.length}
              </Text>
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardBody}>{card.body}</Text>
          </View>
        </Animated.View>

        {/* Navigation */}
        <View style={styles.navRow}>
          {!isFirst ? (
            <FlourishButton
              title="Back"
              onPress={() => setCurrentCard((prev) => prev - 1)}
              variant="outline"
              icon="arrow-back"
            />
          ) : (
            <View />
          )}

          <FlourishButton
            title={isLast ? 'Done' : 'Next'}
            onPress={() => {
              if (isLast) {
                router.back();
              } else {
                setCurrentCard((prev) => prev + 1);
              }
            }}
            icon={isLast ? 'checkmark' : 'arrow-forward'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: Spacing.lg, justifyContent: 'space-between' },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.sage, width: 24 },
  dotDone: { backgroundColor: Colors.sageMuted },
  cardWrap: { flex: 1, justifyContent: 'center' },
  lessonCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.medium,
    minHeight: 280,
    justifyContent: 'center',
  },
  cardNumber: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.sageLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  cardNumberText: { ...Typography.caption1, fontWeight: '600', color: Colors.sageDark },
  cardTitle: { ...Typography.title1, color: Colors.text, marginBottom: Spacing.lg },
  cardBody: { ...Typography.body, color: Colors.textSecondary, lineHeight: 26 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
