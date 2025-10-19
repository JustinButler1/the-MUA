import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';

// Mock data for game details
const gameDetails = {
  id: '1',
  team1: 'post teampage',
  team2: 'scan team',
  finalScore: '120 - 97',
  goal: '110 pts',
  started: 'Oct 7, 2025 at 12:25 AM',
  ended: 'Oct 7, 2025 at 12:27 AM',
  rounds: [
    {
      roundNumber: 1,
      teams: [
        {
          name: 'post teampage',
          bid: 0,
          books: 0,
          delta: '+100',
          total: 100,
        },
        {
          name: 'scan team',
          bid: 4,
          books: 13,
          delta: '+49',
          total: 49,
        },
      ],
    },
    {
      roundNumber: 2,
      teams: [
        {
          name: 'post teampage',
          bid: 1,
          books: 1,
          delta: '+20',
          total: 120,
        },
        {
          name: 'scan team',
          bid: 4,
          books: 12,
          delta: '+48',
          total: 97,
        },
      ],
    },
  ],
};

export default function GameDetailsScreen() {
  const colorScheme = useColorScheme();

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
});
