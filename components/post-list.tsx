import { PostCard } from '@/components/post-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post } from '@/lib/types/posts';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

interface PostListProps {
  posts: Post[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onPostPress?: (post: Post) => void;
  onPostLike?: (post: Post) => void;
  onPostComment?: (post: Post) => void;
  onLoadMore?: () => void;
}

/**
 * Post list component displaying multiple posts
 * Features pull-to-refresh, loading states, and infinite scroll
 */
export function PostList({
  posts,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onPostPress,
  onPostLike,
  onPostComment,
  onLoadMore,
}: PostListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={onPostPress}
      onLike={onPostLike}
      onComment={onPostComment}
    />
  );

  const renderFooter = () => {
    if (isLoading && posts.length > 0) {
      return (
        <View style={styles.footer}>
          <ThemedText style={[styles.loadingText, { color: colors.text, opacity: 0.7 }]}>
            Loading more posts...
          </ThemedText>
        </View>
      );
    }
    return null;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
            />
          ) : undefined
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
});
