import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

// Mock data
const mockTeams = [
  {
    id: '1',
    name: 'yes team test team',
    members: 'Test · guestalex',
  },
];

const mockGames = [
  {
    id: '1',
    team1: 'team1',
    team2: 'yes team test team',
    score1: 130,
    score2: -40,
    winner: 'team1',
    date: 'Oct 6, 2025',
  },
  {
    id: '2',
    team1: 'post teampage',
    team2: 'yes team test team',
    score1: 130,
    score2: -40,
    winner: 'post teampage',
    date: 'Oct 6, 2025',
  },
  {
    id: '3',
    team1: 'post teampage',
    team2: 'scan team',
    score1: 120,
    score2: 97,
    winner: 'post teampage',
    date: 'Oct 6, 2025',
  },
];

export default function SpadesScreen() {
  const colorScheme = useColorScheme();

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
          {mockTeams.map((team) => (
            <TouchableOpacity 
              key={team.id} 
              style={styles.teamCard}
              onPress={() => router.push('/team-manager' as any)}
            >
              <ThemedText style={styles.teamName}>{team.name}</ThemedText>
              <ThemedText style={styles.teamMembers}>{team.members}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Game History */}
        <View style={styles.section}>
          {mockGames.map((game) => (
            <TouchableOpacity 
              key={game.id} 
              style={styles.gameCard}
              onPress={() => router.push('/game-details' as any)}
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
          ))}
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
});
