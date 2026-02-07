import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { SectionHeader } from '@/components/ui/section-header';
import { lessons, rebeccasCornerPosts, communityPosts } from '@/data/mock-data';
import { useApp } from '@/context/app-context';

export default function LearnScreen() {
  const router = useRouter();
  const { likedPosts, toggleLike } = useApp();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.subtitle}>Grow your confidence, gently.</Text>

        {/* ── Quick Invest Lessons ── */}
        <SectionHeader title="Quick Invest" />
        {lessons.map((lesson, index) => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            activeOpacity={0.7}
            onPress={() => router.push(`/lesson/${lesson.id}` as any)}
          >
            <View style={styles.lessonNumber}>
              <Text style={styles.lessonNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.lessonContent}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonSub}>{lesson.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* ── Rebecca's Corner ── */}
        <SectionHeader
          title="Rebecca's Corner"
          action="See all"
          onAction={() => router.push('/rebeccas-corner')}
        />
        <TouchableOpacity
          style={styles.rebeccaCard}
          activeOpacity={0.8}
          onPress={() => router.push('/rebeccas-corner')}
        >
          <View style={styles.rebeccaAvatar}>
            <Text style={styles.rebeccaAvatarText}>R</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rebeccaTitle}>
              {rebeccasCornerPosts[2].title}
            </Text>
            <Text style={styles.rebeccaBody} numberOfLines={2}>
              {rebeccasCornerPosts[2].body}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Community ── */}
        <SectionHeader
          title="Community"
          action="View all"
          onAction={() => router.push('/community')}
        />
        {communityPosts.slice(0, 3).map((post) => (
          <View key={post.id} style={styles.communityCard}>
            <View style={styles.communityHeader}>
              <View style={styles.communityAvatar}>
                <Text style={styles.communityAvatarText}>{post.author[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.communityAuthor}>{post.author}</Text>
                <Text style={styles.communityTime}>{post.timeAgo}</Text>
              </View>
              <View style={styles.communitySavings}>
                <Text style={styles.communitySavingsText}>+£{post.savings}</Text>
              </View>
            </View>
            <Text style={styles.communityContent}>{post.content}</Text>
            <View style={styles.communityFooter}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => toggleLike(post.id)}
              >
                <Ionicons
                  name={likedPosts.has(post.id) ? 'heart' : 'heart-outline'}
                  size={18}
                  color={likedPosts.has(post.id) ? Colors.danger : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.likeCount,
                    likedPosts.has(post.id) && { color: Colors.danger },
                  ]}
                >
                  {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { ...Typography.largeTitle, color: Colors.text, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  // Lessons
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  lessonNumberText: { ...Typography.headline, color: Colors.sageDark },
  lessonContent: { flex: 1 },
  lessonTitle: { ...Typography.headline, color: Colors.text },
  lessonSub: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  // Rebecca's Corner
  rebeccaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.beigeLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.beige,
  },
  rebeccaAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rebeccaAvatarText: { ...Typography.title3, color: Colors.text },
  rebeccaTitle: { ...Typography.headline, color: Colors.text, marginBottom: 4 },
  rebeccaBody: { ...Typography.caption1, color: Colors.textSecondary, lineHeight: 18 },
  // Community
  communityCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  communityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  communityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  communityAvatarText: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.sageDark,
  },
  communityAuthor: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  communityTime: { ...Typography.caption2, color: Colors.textMuted },
  communitySavings: {
    backgroundColor: Colors.sageLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  communitySavingsText: { ...Typography.caption1, fontWeight: '600', color: Colors.sageDark },
  communityContent: { ...Typography.body, color: Colors.text, lineHeight: 22 },
  communityFooter: { flexDirection: 'row', marginTop: Spacing.md },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { ...Typography.caption1, color: Colors.textMuted },
});
