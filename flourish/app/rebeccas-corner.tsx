import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { rebeccasCornerPosts } from '@/data/mock-data';

export default function RebeccasCornerScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>R</Text>
        </View>
        <Text style={styles.headerTitle}>Rebecca's Corner</Text>
        <Text style={styles.headerSub}>
          Personal thoughts, tips, and stories from Flourish's founder.
        </Text>
      </View>

      {/* Posts */}
      {rebeccasCornerPosts.map((post, index) => (
        <Animated.View
          key={post.id}
          entering={FadeInDown.delay(index * 100).duration(400)}
        >
          <View style={styles.postCard}>
            <Text style={styles.postDate}>
              {new Date(post.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postBody}>{post.body}</Text>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  headerCard: {
    backgroundColor: Colors.beigeLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.beige,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: Colors.text },
  headerTitle: { ...Typography.title2, color: Colors.text, marginBottom: Spacing.sm },
  headerSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  postCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  postDate: { ...Typography.caption1, color: Colors.textMuted, marginBottom: Spacing.sm },
  postTitle: { ...Typography.title3, color: Colors.text, marginBottom: Spacing.md },
  postBody: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },
});
