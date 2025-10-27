import { ThemedText } from '@/components/themed-text';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface TeamCardProps {
  teamId: string;
  teamName: string;
  teamMembers: string;
  onPress: (teamId: string) => void;
}

export function TeamCard({ teamId, teamName, teamMembers, onPress }: TeamCardProps) {
  return (
    <TouchableOpacity 
      style={styles.teamCard}
      onPress={() => onPress(teamId)}
    >
      <ThemedText style={styles.teamName}>{teamName}</ThemedText>
      <ThemedText style={styles.teamMembers}>{teamMembers}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});