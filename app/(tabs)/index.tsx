import { EmptyFeed } from '@/components/empty-feed';
import { FilterSelection, type FilterOption } from '@/components/filter-selection';
import { GroupsButton } from '@/components/groups-button';
import { PostList } from '@/components/post-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchDummyPosts, togglePostLike } from '@/lib/data/dummy-posts';
import { type Post } from '@/lib/types/posts';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * Home screen displaying posts from groups the user is subscribed to
 * Features pull-to-refresh, filtering, and post interactions
 */
export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

  /**
   * Fetches posts for the current user
   */
  const fetchPosts = async (isRefresh = false) => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      const fetchedPosts = await fetchDummyPosts(0, 10);
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Handles pull-to-refresh action
   */
  const handleRefresh = () => {
    fetchPosts(true);
  };

  /**
   * Handles post press (placeholder for navigation)
   */
  const handlePostPress = (post: Post) => {
    // TODO: Navigate to post detail screen
    console.log('Post pressed:', post.id);
  };

  /**
   * Handles post like toggle
   */
  const handlePostLike = async (post: Post) => {
    try {
      const updatedPost = await togglePostLike(post.id, !post.isLiked);
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === post.id ? updatedPost : p)
      );
    } catch (err) {
      console.error('Error toggling post like:', err);
    }
  };

  /**
   * Handles post comment (placeholder for navigation)
   */
  const handlePostComment = (post: Post) => {
    // TODO: Navigate to post comments screen
    console.log('Post comment pressed:', post.id);
  };

  /**
   * Handles filter selection change
   */
  const handleFilterChange = (filter: FilterOption) => {
    setSelectedFilter(filter);
    // TODO: Implement actual filtering logic based on selected filter
    console.log('Filter changed to:', filter);
  };

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, [user?.id]);

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerText}>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                  Feed
                </ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]}>
                  Loading posts...
                </ThemedText>
              </View>
              
              {/* Create Post Button */}
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/create-post')}
                activeOpacity={0.7}
              >
                <IconSymbol name="plus" size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
            
            {/* Filter Selection */}
            <FilterSelection
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
            />
            
            {/* Groups Button */}
            <GroupsButton />
          </View>
          
          <View style={styles.loadingContainer}>
            <ThemedText style={[styles.loadingText, { color: colors.text }]}>
              Loading events...
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerText}>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                  Feed
                </ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]}>
                  Error loading posts
                </ThemedText>
              </View>
              
              {/* Create Post Button */}
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/create-post')}
                activeOpacity={0.7}
              >
                <IconSymbol name="plus" size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
            
            {/* Filter Selection */}
            <FilterSelection
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
            />
            
            {/* Groups Button */}
            <GroupsButton />
          </View>
          
          <View style={styles.errorContainer}>
            <ThemedText style={[styles.errorText, { color: colors.text }]}>
              {error}
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Show empty state
  if (posts.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerText}>
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                  Feed
                </ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]}>
                  No posts from your groups
                </ThemedText>
              </View>
              
              {/* Create Post Button */}
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/create-post')}
                activeOpacity={0.7}
              >
                <IconSymbol name="plus" size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
            
            {/* Filter Selection */}
            <FilterSelection
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
            />
            
            {/* Groups Button */}
            <GroupsButton />
          </View>
          
          <EmptyFeed />
        </ScrollView>
      </ThemedView>
    );
  }

  // Show posts feed
  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
              Feed
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]}>
              {posts.length} post{posts.length !== 1 ? 's' : ''} from your groups
            </ThemedText>
          </View>
          
          {/* Create Post Button */}
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/create-post')}
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
        
        {/* Filter Selection */}
        <FilterSelection
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
        />
        
        {/* Groups Button */}
        <GroupsButton />
      </View>

      {/* Posts List */}
      <PostList
        posts={posts}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onPostPress={handlePostPress}
        onPostLike={handlePostLike}
        onPostComment={handlePostComment}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 0,
    paddingVertical: 20,
    paddingTop: 40, // Account for status bar
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 28,
    
  },
  headerSubtitle: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});
