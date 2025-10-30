import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post, isAnnouncementPost, isEventPost, isNewsletterPost, isTextOnlyPost } from '@/lib/types/posts';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface PostCardProps {
  post: Post;
  onPress?: (post: Post) => void;
  onLike?: (post: Post) => void;
  onComment?: (post: Post) => void;
}

/**
 * Post card component displaying a single post
 * Shows author info, group, content, engagement metrics, and actions
 */
export function PostCard({ post, onPress, onLike, onComment }: PostCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handlePress = () => {
    onPress?.(post);
  };

  const handleLike = () => {
    onLike?.(post);
  };

  const handleComment = () => {
    onComment?.(post);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.postCard,
        {
          backgroundColor: colors.background,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={[
            styles.avatar,
            { backgroundColor: colors.tint + '20' }
          ]}>
            <IconSymbol
              name="person.fill"
              size={20}
              color={colors.tint}
            />
          </View>
          <View style={styles.authorDetails}>
            <ThemedText style={[styles.authorName, { color: colors.text }]}>
              {post.author.name}
            </ThemedText>
            <View style={styles.groupInfo}>
              <IconSymbol
                name="person.3.fill"
                size={12}
                color={colors.text}
                style={{ opacity: 0.6 }}
              />
              <ThemedText style={[styles.groupName, { color: colors.text, opacity: 0.7 }]}>
                {post.group.name} Tets
              </ThemedText>
              <ThemedText style={[styles.timeAgo, { color: colors.text, opacity: 0.5 }]}>
                • {formatTimeAgo(post.createdAt)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isTextOnlyPost(post) && (
          <ThemedText style={[styles.postText, { color: colors.text }]}>
            {post.content}
          </ThemedText>
        )}

        {isAnnouncementPost(post) && (
          <>
            <ThemedText style={[styles.newsletterHeadline, { color: colors.text }]}>Announcement Post</ThemedText>
            <ThemedText style={[styles.postText, { color: colors.text }]}>
              {post.content}
            </ThemedText>
          </>
        )}

        {isEventPost(post) && (
          <>
            <ThemedText style={[styles.newsletterHeadline, { color: colors.text }]}>Event Post</ThemedText>
            <ThemedText style={[styles.postText, { color: colors.text }]}>
              {post.content}
            </ThemedText>
            {post.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: post.imageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </>
        )}

        {isNewsletterPost(post) && (
          <>
            <ThemedText style={[styles.newsletterHeadline, { color: colors.text }]}>News Post</ThemedText>
            <ThemedText style={[styles.newsletterHeadline, { color: colors.text }]}>
              {post.headline}
            </ThemedText>
            <ThemedText style={[styles.newsletterSubtext, { color: colors.text, opacity: 0.8 }]}>
              {post.subtext}
            </ThemedText>
            {post.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: post.imageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </View>
            )}
            <View style={styles.newsletterIndicator}>
              <IconSymbol
                name="doc.text"
                size={16}
                color={colors.tint}
              />
              <ThemedText style={[styles.newsletterLabel, { color: colors.tint }]}>
                Newsletter
              </ThemedText>
            </View>
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={post.isLiked ? "heart.fill" : "heart"}
            size={18}
            color={post.isLiked ? "#EF4444" : colors.text}
            style={{ opacity: post.isLiked ? 1 : 0.6 }}
          />
          <ThemedText style={[
            styles.actionText,
            { 
              color: post.isLiked ? "#EF4444" : colors.text,
              opacity: post.isLiked ? 1 : 0.6 
            }
          ]}>
            {post.likes}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleComment}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="bubble.left"
            size={18}
            color={colors.text}
            style={{ opacity: 0.6 }}
          />
          <ThemedText style={[styles.actionText, { color: colors.text, opacity: 0.6 }]}>
            {post.comments}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="square.and.arrow.up"
            size={18}
            color={colors.text}
            style={{ opacity: 0.6 }}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupName: {
    fontSize: 14,
  },
  timeAgo: {
    fontSize: 14,
  },
  content: {
    marginBottom: 16,
  },
  postText: {
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  newsletterHeadline: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  newsletterSubtext: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  newsletterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  newsletterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
