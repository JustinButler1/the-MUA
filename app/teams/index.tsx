import { TeamCard } from '@/components/team-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUserTeams, type Team } from '@/lib/queries/teams';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * Teams listing screen displaying all teams the user is a member of
 * Features pull-to-refresh, empty state, and navigation to team details
 */
export default function TeamsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches teams for the current user
   */
  const fetchTeams = useCallback(async (isRefresh = false) => {
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
      const userTeams = await getUserTeams(user.id);
      setTeams(userTeams);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  /**
   * Handles pull-to-refresh action
   */
  const handleRefresh = () => {
    fetchTeams(true);
  };

  /**
   * Handles team card press - navigates to team details
   */
  const handleTeamPress = (teamId: string) => {
    router.push({ pathname: '/teams/[teamId]', params: { teamId } } as any);
  };

  /**
   * Handles create team button press
   */
  const handleCreateTeam = () => {
    router.push('/teams/create');
  };

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Show loading state
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: colors.text }]}>
            Loading teams...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: colors.text }]}>
            {error}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => fetchTeams()}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            My Teams
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]}>
            {teams.length} team{teams.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Create Team Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.tint }]}
          onPress={handleCreateTeam}
          activeOpacity={0.8}
        >
          <IconSymbol
            name="plus"
            size={20}
            color="#FFFFFF"
          />
          <ThemedText style={styles.createButtonText}>
            Create New Team
          </ThemedText>
        </TouchableOpacity>

        {/* Teams List */}
        {teams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              name="person.3"
              size={48}
              color={colors.text}
              style={{ opacity: 0.3 }}
            />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
              No Teams Yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.text, opacity: 0.7 }]}>
              Create your first team to start playing with friends
            </ThemedText>
          </View>
        ) : (
          <View style={styles.teamsList}>
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                teamId={team.id}
                teamName={team.name}
                teamMembers={`${team.memberCount} member${team.memberCount !== 1 ? 's' : ''}`}
                onPress={handleTeamPress}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 40, // Account for status bar
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  teamsList: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
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
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
