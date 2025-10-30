import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NewsletterPost } from '@/lib/types/posts';
import { router } from 'expo-router';
import React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface NewsletterDetailProps {
  post: NewsletterPost;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onLike?: (post: NewsletterPost) => void;
  onComment?: (post: NewsletterPost) => void;
}

/**
 * Newsletter detail page component
 * Displays the full newsletter content with headline, subtext, and main content
 * Includes navigation back, engagement actions, and refresh capability
 */
export function NewsletterDetail({
  post,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onLike,
  onComment,
}: NewsletterDetailProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handleBack = () => {
    router.back();
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
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Newsletter
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]}>
            {post.group.name}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Author Info */}
        <View style={styles.authorSection}>
          <View style={[
            styles.avatar,
            { backgroundColor: colors.tint + '20' }
          ]}>
            <IconSymbol
              name="person.fill"
              size={24}
              color={colors.tint}
            />
          </View>
          <View style={styles.authorDetails}>
            <ThemedText style={[styles.authorName, { color: colors.text }]}>
              {post.author.name}
            </ThemedText>
            <ThemedText style={[styles.timeAgo, { color: colors.text, opacity: 0.6 }]}>
              {formatTimeAgo(post.createdAt)}
            </ThemedText>
          </View>
        </View>

        {/* Newsletter Content */}
        <View style={styles.content}>
          <ThemedText style={[styles.headline, { color: colors.text }]}>
            {post.headline}
          </ThemedText>
          
          <ThemedText style={[styles.subtext, { color: colors.text, opacity: 0.8 }]}>
            {post.subtext}
          </ThemedText>

          {post.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: post.imageUrl }}
                style={styles.newsletterImage}
                resizeMode="cover"
              />
            </View>
          )}

          {post.content && (
            <View style={styles.mainContent}>
              <ThemedText style={[styles.contentText, { color: colors.text }]}>
                {post.content}
              </ThemedText>
            </View>
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
              size={20}
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
              size={20}
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
              size={20}
              color={colors.text}
              style={{ opacity: 0.6 }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtext: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 20,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  newsletterImage: {
    width: '100%',
    height: 250,
  },
  mainContent: {
    marginTop: 8,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
