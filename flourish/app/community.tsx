import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { communityPosts } from '@/data/mock-data';

export default function CommunityScreen() {
  const { likedPosts, toggleLike } = useApp();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>Real savings from real mums. Share yours too.</Text>

      {communityPosts.map((post, index) => (
        <Animated.View
          key={post.id}
          entering={FadeInDown.delay(index * 80).duration(400)}
        >
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{post.author[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{post.author}</Text>
                <Text style={styles.timeAgo}>{post.timeAgo}</Text>
              </View>
              <View style={styles.savingsTag}>
                <Ionicons name="leaf" size={12} color={Colors.sageDark} />
                <Text style={styles.savingsTagText}>+£{post.savings}</Text>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.postFooter}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => toggleLike(post.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={likedPosts.has(post.id) ? 'heart' : 'heart-outline'}
                  size={20}
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
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  intro: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  postCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { ...Typography.headline, color: Colors.sageDark },
  authorName: { ...Typography.headline, color: Colors.text },
  timeAgo: { ...Typography.caption2, color: Colors.textMuted, marginTop: 2 },
  savingsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sageLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  savingsTagText: { ...Typography.caption1, fontWeight: '600', color: Colors.sageDark },
  postContent: { ...Typography.body, color: Colors.text, lineHeight: 24 },
  postFooter: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { ...Typography.subhead, color: Colors.textMuted },
});
