import { TeamCard } from '@/components/team-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

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

interface LiveGame {
  id: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  goalScore: number;
  startedAt: string;
}


export default function SpadesScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingLiveGames, setIsLoadingLiveGames] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const scanningRef = useRef(false);
  const lastScanTimeRef = useRef(0);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setIsLoadingTeams(false);
      return;
    }

    try {
      // First, get teams where user is a member
      const { data: userTeams, error: userTeamsError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (userTeamsError) {
        console.error('Error fetching user teams:', userTeamsError);
        Alert.alert('Error', 'Failed to load teams');
        return;
      }

      if (!userTeams || userTeams.length === 0) {
        setTeams([]);
        return;
      }

      // Get all members for each team
      const teamIds = userTeams.map(t => t.team_id);
      const { data: allTeamMembers, error: teamMembersError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          slot,
          teams!inner(id, name),
          profiles(display_name),
          team_guests(display_name)
        `)
        .in('team_id', teamIds)
        .order('team_id, slot');

      if (teamMembersError) {
        console.error('Error fetching team members:', teamMembersError);
        Alert.alert('Error', 'Failed to load teams');
        return;
      }

      // Process team data - group by team and collect all members
      const teamMap = new Map();
      
      allTeamMembers?.forEach((member: any) => {
        const teamId = member.team_id;
        const team = member.teams;
        
        if (!teamMap.has(teamId)) {
          teamMap.set(teamId, {
            id: team.id,
            name: team.name,
            members: []
          });
        }
        
        // Add member to the team
        if (member.profiles?.display_name) {
          teamMap.get(teamId).members.push(member.profiles.display_name);
        }
        if (member.team_guests?.display_name) {
          teamMap.get(teamId).members.push(member.team_guests.display_name + ' (Guest)');
        }
      });

      const processedTeams: Team[] = Array.from(teamMap.values()).map(team => ({
        id: team.id,
        name: team.name,
        members: team.members.join(' · ')
      }));

      setTeams(processedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setIsLoadingTeams(false);
    }
  }, [user]);

  const fetchLiveGames = useCallback(async () => {
    if (!user) {
      setIsLoadingLiveGames(false);
      return;
    }

    try {
      // Get user's teams
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (teamError) {
        console.error('Error fetching teams:', teamError);
        setIsLoadingLiveGames(false);
        return;
      }

      const teamIds = teamMembers?.map((member: any) => member.team_id) || [];

      if (teamIds.length === 0) {
        setLiveGames([]);
        setIsLoadingLiveGames(false);
        return;
      }

      // Fetch active games for user's teams
      const { data: gamesData, error: gamesError } = await supabase
        .from('spades_games')
        .select(`
          id,
          team1_id,
          team2_id,
          goal_score,
          started_at,
          status,
          team1:teams!team1_id(name),
          team2:teams!team2_id(name)
        `)
        .eq('status', 'in_progress')
        .or(`team1_id.in.(${teamIds.join(',')}),team2_id.in.(${teamIds.join(',')})`)
        .order('started_at', { ascending: false });

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
        setIsLoadingLiveGames(false);
        return;
      }

      // For each game, fetch the latest hands to calculate current scores
      const gamesWithScores: LiveGame[] = [];
      
      for (const game of gamesData || []) {
        const { data: handsData } = await supabase
          .from('spades_hands')
          .select('team1_delta, team2_delta')
          .eq('game_id', game.id);

        let team1Score = 0;
        let team2Score = 0;

        handsData?.forEach((hand: any) => {
          team1Score += hand.team1_delta || 0;
          team2Score += hand.team2_delta || 0;
        });

        gamesWithScores.push({
          id: game.id,
          team1Name: (game.team1 as any)?.name || 'Team 1',
          team2Name: (game.team2 as any)?.name || 'Team 2',
          team1Score,
          team2Score,
          goalScore: game.goal_score || 500,
          startedAt: game.started_at,
        });
      }

      setLiveGames(gamesWithScores);
    } catch (error) {
      console.error('Error fetching live games:', error);
    } finally {
      setIsLoadingLiveGames(false);
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
    fetchLiveGames();
    fetchGames();
  }, [fetchTeams, fetchLiveGames, fetchGames]);

  // Subscribe to realtime updates for games
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for spades games');

    // Subscribe to changes in spades_games table
    const gamesSubscription = supabase
      .channel('spades-games-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'spades_games',
        },
        (payload) => {
          console.log('Received spades_games update:', payload);
          // Refresh live games and completed games when any game changes
          fetchLiveGames();
          fetchGames();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spades_hands',
        },
        (payload) => {
          console.log('Received spades_hands update:', payload);
          // Refresh live games when hands are updated (to show updated scores)
          fetchLiveGames();
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      console.log('Cleaning up spades games realtime subscription');
      supabase.removeChannel(gamesSubscription);
    };
  }, [user, fetchLiveGames, fetchGames]);

  // QR Scanner functions
  const scanGameQR = async () => {
    if (!permission) {
      // Request permission if we don't have it yet
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
        return;
      }
    } else if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    
    setHasScanned(false);
    scanningRef.current = false;
    lastScanTimeRef.current = 0;
    setShowQRScanner(true);
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    // Immediate synchronous check to prevent concurrent scans
    if (scanningRef.current) return;
    
    // Debounce: require at least 2 seconds between scans
    const now = Date.now();
    if (now - lastScanTimeRef.current < 2000) return;
    
    // Mark as scanning immediately (synchronous)
    scanningRef.current = true;
    lastScanTimeRef.current = now;
    setHasScanned(true);
    
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(data);
      if (parsed.type === 'game_spectator' && parsed.gameId) {
        // Navigate to the live game
        setShowQRScanner(false);
        router.push({ pathname: '/games/live', params: { gameId: parsed.gameId } } as any);
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not a valid game spectator code.', [
          {
            text: 'OK',
            onPress: () => setShowQRScanner(false),
          },
        ]);
      }
    } catch (error) {
      console.error('Error parsing QR code:', error);
      Alert.alert('Invalid QR Code', 'This QR code is not valid or does not belong to a game.', [
        {
          text: 'OK',
          onPress: () => setShowQRScanner(false),
        },
      ]);
    }
  };

  // Refresh data when screen comes into focus (e.g., returning from create-team)
  useFocusEffect(
    useCallback(() => {
      fetchTeams();
      fetchLiveGames();
      fetchGames();
    }, [fetchTeams, fetchLiveGames, fetchGames])
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
          onPress={() => router.push('/teams/create' as any)}
        >
          <ThemedText style={styles.createTeamButtonText}>Create Team</ThemedText>
        </TouchableOpacity>

        {/* Watch Live Game Button */}
        <TouchableOpacity 
          style={styles.watchLiveButton}
          onPress={scanGameQR}
        >
          <ThemedText style={styles.watchLiveButtonText}>📱 Watch Live Game</ThemedText>
        </TouchableOpacity>

        {/* Live Games Section */}
        {isLoadingLiveGames ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>LIVE GAMES</ThemedText>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#EF4444" />
              <ThemedText style={styles.loadingText}>Loading live games...</ThemedText>
            </View>
          </View>
        ) : liveGames.length > 0 ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>LIVE GAMES</ThemedText>
            {liveGames.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.liveGameCard}
                onPress={() => router.push({ pathname: '/games/live', params: { gameId: game.id } } as any)}
              >
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <ThemedText style={styles.liveText}>LIVE</ThemedText>
                </View>

                <View style={styles.gameHeader}>
                  <View style={styles.teamPill}>
                    <ThemedText style={styles.teamPillText}>{game.team1Name}</ThemedText>
                  </View>
                  <ThemedText style={styles.vsText}>VS</ThemedText>
                  <View style={styles.teamPill}>
                    <ThemedText style={styles.teamPillText}>{game.team2Name}</ThemedText>
                  </View>
                </View>

                <View style={styles.liveScoreRow}>
                  <ThemedText style={styles.liveScore}>{game.team1Score} - {game.team2Score}</ThemedText>
                  <ThemedText style={styles.liveGoal}>of {game.goalScore}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

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
              <TeamCard
                key={team.id}
                teamId={team.id}
                teamName={team.name}
                teamMembers={team.members}
                onPress={(teamId) => router.push({ pathname: '/teams/[teamId]', params: { teamId } } as any)}
              />
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
                onPress={() => router.push({ pathname: '/games/[gameId]', params: { gameId: game.id } } as any)}
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
        onPress={() => router.push('/games/live' as any)}
      >
        <ThemedText style={styles.addGameButtonText}>Add Spades Game</ThemedText>
      </TouchableOpacity>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <ThemedText style={styles.scannerTitle}>Scan Game QR Code</ThemedText>
            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => setShowQRScanner(false)}
            >
              <ThemedText style={styles.closeScannerButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </View>
          
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
              <ThemedText style={styles.scannerInstructions}>
                Position the game QR code within the frame
              </ThemedText>
            </View>
          </CameraView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
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
    bottom: 30,
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
  liveGameCard: {
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  liveScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  liveScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ECEDEE',
  },
  liveGoal: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  // Watch Live Button styles
  watchLiveButton: {
    backgroundColor: '#1A1A24',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  watchLiveButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // QR Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0A0A0F',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ECEDEE',
  },
  closeScannerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeScannerButtonText: {
    fontSize: 24,
    color: '#ECEDEE',
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#4A90E2',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    fontSize: 16,
    color: '#ECEDEE',
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
