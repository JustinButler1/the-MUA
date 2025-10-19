import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
          {/* Spades Card */}
          <TouchableOpacity style={[styles.gameCard, { backgroundColor: '#1A1A24' }]}>
            <View style={[styles.liveBadge, { backgroundColor: '#EF4444' }]}>
              <ThemedText style={styles.badgeText}>LIVE</ThemedText>
            </View>
            <ThemedText style={styles.gameTitle}>Spades</ThemedText>
            <ThemedText style={styles.gameDescription}>LIVE BIDS, LOGS, AND STATISTICS</ThemedText>
          </TouchableOpacity>
          
          {/* Chess Card */}
          <TouchableOpacity style={[styles.gameCard, { backgroundColor: '#1A1A24' }]}>
            <View style={[styles.soonBadge, { backgroundColor: '#9BA1A6' }]}>
              <ThemedText style={[styles.badgeText, { color: '#1A1A24' }]}>SOON</ThemedText>
            </View>
            <ThemedText style={styles.gameTitle}>Chess</ThemedText>
            <ThemedText style={styles.gameDescription}>LIVE SCORE TRACKING IN DEVELOPMENT</ThemedText>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
  gameCard: {
    padding: 24,
    borderRadius: 16,
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soonBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ECEDEE',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginTop: 20,
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: '#9BA1A6',
    lineHeight: 20,
  },
});
