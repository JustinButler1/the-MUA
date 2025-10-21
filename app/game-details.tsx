import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

interface GameDetails {
  id: string;
  team1: string;
  team2: string;
  finalScore: string;
  goal: string;
  started: string;
  ended: string;
  rounds: Round[];
}

interface Round {
  roundNumber: number;
  teams: TeamRoundData[];
}

interface TeamRoundData {
  name: string;
  bid: number;
  books: number;
  delta: string;
  total: number;
}

export default function GameDetailsScreen() {
  const colorScheme = useColorScheme();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!gameId) {
        Alert.alert('Error', 'No game ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch game basic info
        const { data: gameData, error: gameError } = await supabase
          .from('spades_games')
          .select(`
            id,
            started_at,
            goal_score,
            team1_id,
            team2_id,
            team1:teams!team1_id(name),
            team2:teams!team2_id(name)
          `)
          .eq('id', gameId)
          .single();

        if (gameError || !gameData) {
          console.error('Error fetching game:', gameError);
          Alert.alert('Error', 'Failed to load game details');
          setIsLoading(false);
          return;
        }

        // Fetch game outcome
        const { data: outcomeData, error: outcomeError } = await supabase
          .from('spades_game_outcomes')
          .select('*')
          .eq('game_id', gameId)
          .single();

        if (outcomeError || !outcomeData) {
          console.error('Error fetching outcome:', outcomeError);
          Alert.alert('Error', 'Failed to load game outcome');
          setIsLoading(false);
          return;
        }

        // Fetch hands/rounds
        const { data: handsData, error: handsError } = await supabase
          .from('spades_hands')
          .select('*')
          .eq('game_id', gameId)
          .order('hand_no', { ascending: true });

        if (handsError) {
          console.error('Error fetching hands:', handsError);
          Alert.alert('Error', 'Failed to load round history');
          setIsLoading(false);
          return;
        }

        // Format the data
        const team1Name = (gameData.team1 as any)?.name || 'Unknown Team';
        const team2Name = (gameData.team2 as any)?.name || 'Unknown Team';

        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) + ' at ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        };

        const formatDelta = (delta: number) => {
          return delta >= 0 ? `+${delta}` : `${delta}`;
        };

        const rounds: Round[] = handsData?.map((hand: any) => ({
          roundNumber: hand.hand_no,
          teams: [
            {
              name: team1Name,
              bid: hand.team1_bid,
              books: hand.team1_books,
              delta: formatDelta(hand.team1_delta),
              total: hand.team1_total_after,
            },
            {
              name: team2Name,
              bid: hand.team2_bid,
              books: hand.team2_books,
              delta: formatDelta(hand.team2_delta),
              total: hand.team2_total_after,
            },
          ],
        })) || [];

        const details: GameDetails = {
          id: gameData.id,
          team1: team1Name,
          team2: team2Name,
          finalScore: `${outcomeData.team1_total} - ${outcomeData.team2_total}`,
          goal: `${gameData.goal_score || 500} pts`,
          started: formatDate(gameData.started_at),
          ended: formatDate(outcomeData.completed_at),
          rounds,
        };

        setGameDetails(details);
      } catch (error) {
        console.error('Unexpected error fetching game details:', error);
        Alert.alert('Error', 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameId]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <ThemedText style={styles.loadingText}>Loading game details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!gameDetails) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>No game details found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Game Summary Card */}
        <View style={styles.gameSummaryCard}>
          <View style={styles.teamsHeader}>
            <View style={[styles.teamPill, { backgroundColor: '#8B4513' }]}>
              <ThemedText style={styles.teamPillText}>{gameDetails.team1}</ThemedText>
            </View>
            <ThemedText style={styles.vsText}>VS</ThemedText>
            <View style={[styles.teamPill, { backgroundColor: '#2A1A2A' }]}>
              <ThemedText style={styles.teamPillText}>{gameDetails.team2}</ThemedText>
            </View>
          </View>
          
          <View style={styles.gameInfo}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>FINAL SCORE</ThemedText>
              <ThemedText style={styles.infoValue}>{gameDetails.finalScore}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>GOAL</ThemedText>
              <ThemedText style={styles.infoValue}>{gameDetails.goal}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>STARTED</ThemedText>
              <ThemedText style={styles.infoValue}>{gameDetails.started}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>ENDED</ThemedText>
              <ThemedText style={styles.infoValue}>{gameDetails.ended}</ThemedText>
            </View>
          </View>
        </View>

        {/* Round History Section */}
        <ThemedText style={styles.sectionTitle}>Round History</ThemedText>
        
        {gameDetails.rounds.map((round) => (
          <View key={round.roundNumber} style={styles.roundCard}>
            <ThemedText style={styles.roundTitle}>Round {round.roundNumber}</ThemedText>
            
            <View style={styles.roundTable}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <ThemedText style={styles.headerCell}>TEAM</ThemedText>
                <ThemedText style={styles.headerCell}>BID/BOOKS</ThemedText>
                <ThemedText style={styles.headerCell}>Δ</ThemedText>
                <ThemedText style={styles.headerCell}>TOTAL</ThemedText>
              </View>
              
              {/* Table Rows */}
              {round.teams.map((team, index) => (
                <View key={index} style={styles.tableRow}>
                  <ThemedText style={styles.tableCell}>{team.name}</ThemedText>
                  <ThemedText style={styles.tableCell}>{team.bid}/{team.books}</ThemedText>
                  <ThemedText style={[styles.tableCell, styles.deltaCell]}>{team.delta}</ThemedText>
                  <ThemedText style={styles.tableCell}>{team.total}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        ))}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEDEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerTitle: {
    color: '#ECEDEE',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 30,
  },
  gameSummaryCard: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  teamsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
  },
  teamPillText: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  vsText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  gameInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#9BA1A6',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#ECEDEE',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 20,
  },
  roundCard: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginBottom: 16,
  },
  roundTable: {
    gap: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    color: '#9BA1A6',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#ECEDEE',
    fontWeight: '500',
  },
  deltaCell: {
    color: '#EF4444',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#ECEDEE',
    fontSize: 16,
    marginTop: 16,
  },
});
