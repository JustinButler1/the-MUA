import { GameCard } from '@/components/game-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ARENA Badge */}
        <View style={styles.arenaBadge}>
          <ThemedText style={styles.arenaText}>ARENA</ThemedText>
        </View>
        
        {/* Title */}
        <ThemedText style={styles.title}>Pick Your Table</ThemedText>
        
        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>Summon a live scoreboard or browse match history.</ThemedText>
        
        {/* Game Cards */}
        <View style={styles.gameCardsContainer}>
          <GameCard
            title="Spades"
            description="LIVE BIDS, LOGS, AND STATISTICS"
            badgeType="live"
            onPress={() => router.push('/(tabs)/games/spades')}
          />
          
          <GameCard
            title="Chess"
            description="TRACK MATCHES AND USE CHESS CLOCK"
            badgeType="live"
            onPress={() => router.push('/(tabs)/games/chess')}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flex: 1,
  },
  arenaBadge: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  arenaText: {
    color: '#ECEDEE',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ECEDEE',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA1A6',
    textAlign: 'center',
    marginBottom: 40,
  },
  gameCardsContainer: {
    gap: 20,
  },
});
