import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

// Types for team and game data
interface Team {
  id: string;
  name: string;
  members: string;
}

interface Game {
  id: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  winner: string;
  date: string;
}


export default function SpadesScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setIsLoadingTeams(false);
      return;
    }

    try {
      // Fetch teams where user is a member
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(id, name),
          profiles(display_name),
          team_guests(display_name)
        `)
        .eq('user_id', user.id);

      if (teamError) {
        console.error('Error fetching teams:', teamError);
        Alert.alert('Error', 'Failed to load teams');
        return;
      }

      // Process team data
      const processedTeams: Team[] = teamMembers?.map((member: any) => {
        const team = member.teams;
        const members = [];
        
        // Get all members for this team
        if (member.profiles?.display_name) {
          members.push(member.profiles.display_name);
        }
        if (member.team_guests?.display_name) {
          members.push(member.team_guests.display_name);
        }
        
        return {
          id: team.id,
          name: team.name,
          members: members.join(' · ')
        };
      }) || [];

      setTeams(processedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setIsLoadingTeams(false);
    }
  }, [user]);

  const fetchGames = useCallback(async () => {
    if (!user) {
      setIsLoadingGames(false);
      return;
    }

    try {
      // First get team IDs where user is a member
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (teamError) {
        console.error('Error fetching user teams for games:', teamError);
        Alert.alert('Error', 'Failed to load games');
        return;
      }

      const teamIds = teamMembers?.map((member: any) => member.team_id) || [];

      if (teamIds.length === 0) {
        setGames([]);
        setIsLoadingGames(false);
        return;
      }

      // Fetch games where user participated
      const { data: gamesData, error: gamesError } = await supabase
        .from('spades_games')
        .select(`
          id,
          team1_id,
          team2_id,
          started_at,
          team1:teams!team1_id(name),
          team2:teams!team2_id(name)
        `)
        .or(`team1_id.in.(${teamIds.join(',')}),team2_id.in.(${teamIds.join(',')})`)
        .eq('status', 'completed')
        .order('started_at', { ascending: false });

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
        Alert.alert('Error', 'Failed to load games');
        return;
      }

      // Get game IDs to fetch outcomes
      const gameIds = gamesData?.map((game: any) => game.id) || [];
      
      // Fetch outcomes for these games
      let outcomes: any[] = [];
      if (gameIds.length > 0) {
        const { data: outcomesData, error: outcomesError } = await supabase
          .from('spades_game_outcomes')
          .select('*')
          .in('game_id', gameIds);
        
        if (outcomesError) {
          console.error('Error fetching outcomes:', outcomesError);
          // Continue without outcomes data
        } else {
          outcomes = outcomesData || [];
        }
      }

      // Process game data
      const processedGames: Game[] = gamesData?.map((game: any) => {
        const outcome = outcomes.find((o: any) => o.game_id === game.id);
        const team1Name = (game.team1 as any)?.name || 'Unknown Team';
        const team2Name = (game.team2 as any)?.name || 'Unknown Team';
        const winnerTeamId = outcome?.winner_team_id;
        const winner = winnerTeamId === game.team1_id ? team1Name : team2Name;
        
        const date = outcome?.completed_at 
          ? new Date(outcome.completed_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          : 'Unknown Date';

        return {
          id: game.id,
          team1: team1Name,
          team2: team2Name,
          score1: outcome?.team1_total || 0,
          score2: outcome?.team2_total || 0,
          winner,
          date
        };
      }) || [];

      setGames(processedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      Alert.alert('Error', 'Failed to load games');
    } finally {
      setIsLoadingGames(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeams();
    fetchGames();
  }, [fetchTeams, fetchGames]);

  // Refresh data when screen comes into focus (e.g., returning from create-team)
  useFocusEffect(
    useCallback(() => {
      fetchTeams();
      fetchGames();
    }, [fetchTeams, fetchGames])
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SPADES Badge */}
        <View style={styles.spadesBadge}>
          <ThemedText style={styles.spadesBadgeText}>SPADES</ThemedText>
        </View>
        
        {/* Title */}
        <ThemedText style={styles.title}>Match Library</ThemedText>
        
        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>
          Browse past tables, launch a new slate, or craft teams for your crew.
        </ThemedText>
        
        {/* Create Team Button */}
        <TouchableOpacity 
          style={styles.createTeamButton}
          onPress={() => router.push('/create-team' as any)}
        >
          <ThemedText style={styles.createTeamButtonText}>Create Team</ThemedText>
        </TouchableOpacity>

        {/* Your Teams Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>YOUR TEAMS</ThemedText>
          {isLoadingTeams ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#EF4444" />
              <ThemedText style={styles.loadingText}>Loading teams...</ThemedText>
            </View>
          ) : teams.length === 0 ? (
            <ThemedText style={styles.emptyText}>No teams yet. Create your first team!</ThemedText>
          ) : (
            teams.map((team) => (
              <TouchableOpacity 
                key={team.id} 
                style={styles.teamCard}
                onPress={() => router.push('/team-manager' as any)}
              >
                <ThemedText style={styles.teamName}>{team.name}</ThemedText>
                <ThemedText style={styles.teamMembers}>{team.members}</ThemedText>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Game History */}
        <View style={styles.section}>
          {isLoadingGames ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#EF4444" />
              <ThemedText style={styles.loadingText}>Loading games...</ThemedText>
            </View>
          ) : games.length === 0 ? (
            <ThemedText style={styles.emptyText}>No games yet. Start your first game!</ThemedText>
          ) : (
            games.map((game) => (
              <TouchableOpacity 
                key={game.id} 
                style={styles.gameCard}
                onPress={() => router.push({ pathname: '/game-details', params: { gameId: game.id } } as any)}
              >
                <View style={styles.gameHeader}>
                  <View style={styles.teamPill}>
                    <ThemedText style={styles.teamPillText}>{game.team1}</ThemedText>
                  </View>
                  <ThemedText style={styles.vsText}>VS</ThemedText>
                  <View style={styles.teamPill}>
                    <ThemedText style={styles.teamPillText}>{game.team2}</ThemedText>
                  </View>
                </View>
                
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreItem}>
                    <ThemedText style={styles.scoreText}>{game.score1}</ThemedText>
                    <ThemedText style={styles.playedText}>PLAYED</ThemedText>
                    <ThemedText style={styles.dateText}>{game.date}</ThemedText>
                  </View>
                  <View style={styles.scoreItem}>
                    <ThemedText style={styles.scoreText}>{game.score2}</ThemedText>
                    <View style={styles.winnerBadge}>
                      <ThemedText style={styles.winnerText}>Winner • {game.winner}</ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Spades Game Button */}
      <TouchableOpacity 
        style={styles.addGameButton}
        onPress={() => router.push('/live-spades' as any)}
      >
        <ThemedText style={styles.addGameButtonText}>Add Spades Game</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    color: '#ECEDEE',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 30,
  },
  spadesBadge: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  spadesBadgeText: {
    color: '#9BA1A6',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA1A6',
    lineHeight: 24,
    marginBottom: 24,
  },
  createTeamButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 40,
  },
  createTeamButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA1A6',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  teamCard: {
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  teamMembers: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  gameCard: {
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamPill: {
    backgroundColor: '#2A1A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  teamPillText: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  vsText: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 4,
  },
  playedText: {
    fontSize: 12,
    color: '#9BA1A6',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#ECEDEE',
  },
  winnerBadge: {
    backgroundColor: '#2A1A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  winnerText: {
    fontSize: 12,
    color: '#ECEDEE',
    fontWeight: '500',
  },
  addGameButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addGameButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#ECEDEE',
    fontSize: 14,
    marginLeft: 8,
  },
  emptyText: {
    color: '#9BA1A6',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
