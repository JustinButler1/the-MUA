import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

// Types for game data
interface ChessGame {
  id: string;
  player1: string;
  player2: string;
  winner: string;
  date: string;
}

export default function ChessScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [games, setGames] = useState<ChessGame[]>([]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Future: Fetch games from database
      setGames([]);
    }, [])
  );

  const handleChessClockPress = () => {
    router.push('/games/chess-clock' as any);
  };

  const handleStartGamePress = () => {
    Alert.alert(
      'Coming Soon',
      'Start Chess Game feature is currently in development.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CHESS Badge */}
        <View style={styles.chessBadge}>
          <ThemedText style={styles.chessBadgeText}>CHESS</ThemedText>
        </View>
        
        {/* Title */}
        <ThemedText style={styles.title}>Match Library</ThemedText>
        
        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>
          Track your chess matches, use the chess clock, or start a new game.
        </ThemedText>
        
        {/* Chess Clock Button */}
        <TouchableOpacity 
          style={styles.chessClockButton}
          onPress={handleChessClockPress}
        >
          <ThemedText style={styles.chessClockButtonText}>Chess Clock</ThemedText>
        </TouchableOpacity>

        {/* Finished Games Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>FINISHED GAMES</ThemedText>
          {games.length === 0 ? (
            <ThemedText style={styles.emptyText}>No games yet. Start your first chess match!</ThemedText>
          ) : (
            games.map((game) => (
              <TouchableOpacity 
                key={game.id} 
                style={styles.gameCard}
                onPress={() => {
                  Alert.alert(
                    'Coming Soon',
                    'Game details view is currently in development.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <View style={styles.gameHeader}>
                  <View style={styles.playerPill}>
                    <ThemedText style={styles.playerPillText}>{game.player1}</ThemedText>
                  </View>
                  <ThemedText style={styles.vsText}>VS</ThemedText>
                  <View style={styles.playerPill}>
                    <ThemedText style={styles.playerPillText}>{game.player2}</ThemedText>
                  </View>
                </View>
                
                <View style={styles.gameInfo}>
                  <ThemedText style={styles.dateText}>{game.date}</ThemedText>
                  <View style={styles.winnerBadge}>
                    <ThemedText style={styles.winnerText}>Winner • {game.winner}</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Start Game Button */}
      <TouchableOpacity 
        style={styles.startGameButton}
        onPress={handleStartGamePress}
      >
        <ThemedText style={styles.startGameButtonText}>Start Game</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 30,
  },
  chessBadge: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  chessBadgeText: {
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
  chessClockButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 40,
  },
  chessClockButtonText: {
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
  playerPill: {
    backgroundColor: '#2A1A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  playerPillText: {
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
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  winnerBadge: {
    backgroundColor: '#2A1A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winnerText: {
    fontSize: 12,
    color: '#ECEDEE',
    fontWeight: '500',
  },
  startGameButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startGameButtonText: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9BA1A6',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

