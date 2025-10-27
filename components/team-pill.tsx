import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View } from 'react-native';

interface TeamPillProps {
  teamName: string;
  backgroundColor?: string;
}

export function TeamPill({ teamName, backgroundColor = '#8B4513' }: TeamPillProps) {
  return (
    <View style={[styles.teamPill, { backgroundColor }]}>
      <ThemedText style={styles.teamPillText}>{teamName}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
