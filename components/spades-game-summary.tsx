import { TeamPill } from '@/components/team-pill';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View } from 'react-native';

interface SpadesGameSummaryProps {
  team1: string;
  team2: string;
  finalScore: string;
  goal: string;
  started: string;
  ended: string;
}

export function SpadesGameSummary({
  team1,
  team2,
  finalScore,
  goal,
  started,
  ended,
}: SpadesGameSummaryProps) {
  return (
    <View style={styles.gameSummaryCard}>
      <View style={styles.teamsHeader}>
        <TeamPill teamName={team1} backgroundColor="#8B4513" />
        <ThemedText style={styles.vsText}>VS</ThemedText>
        <TeamPill teamName={team2} backgroundColor="#2A1A2A" />
      </View>
      
      <View style={styles.gameInfo}>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>FINAL SCORE</ThemedText>
          <ThemedText style={styles.infoValue}>{finalScore}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>GOAL</ThemedText>
          <ThemedText style={styles.infoValue}>{goal}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>STARTED</ThemedText>
          <ThemedText style={styles.infoValue}>{started}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>ENDED</ThemedText>
          <ThemedText style={styles.infoValue}>{ended}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
